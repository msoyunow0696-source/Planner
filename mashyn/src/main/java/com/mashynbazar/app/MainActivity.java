package com.mashynbazar.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final int REQ_PICK = 2001;
    private static final int REQ_NOTIFY = 2002;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF0F0C29);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);     // данные прототипа (объявления, аккаунты) хранятся здесь
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);

        // Мост для уведомлений: страница сообщает о входе и выходе из аккаунта
        webView.addJavascriptInterface(new NotifyBridge(), "MBAndroid");

        webView.setWebViewClient(new WebViewClient() {
            // Звонки, WhatsApp и внешние сайты открываем в других приложениях телефона
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternal(request.getUrl());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            // Выбор фото (можно несколько) или одного видео для объявления
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                String[] accept = params.getAcceptTypes();
                boolean video = accept != null && accept.length > 0 && accept[0].startsWith("video");
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(video ? "video/*" : "image/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(intent, video ? "Выберите видео" : "Выберите фото"), REQ_PICK);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    private class NotifyBridge {
        @JavascriptInterface
        public String deviceKey() { return NotifyJob.deviceKey(MainActivity.this); }

        @JavascriptInterface
        public void enable(double since) {
            NotifyJob.enable(MainActivity.this, (long) since);
            // Android 13+ спрашивает разрешение на уведомления
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, REQ_NOTIFY));
            }
        }

        @JavascriptInterface
        public void disable() { NotifyJob.disable(MainActivity.this); }

        @JavascriptInterface
        public void seen(double time) { NotifyJob.markSeen(MainActivity.this, (long) time); }

        /** Номер сборки (= build-N на GitHub) — для «Доступна новая версия». */
        @JavascriptInterface
        public int versionCode() {
            try {
                PackageInfo p = getPackageManager().getPackageInfo(getPackageName(), 0);
                return Build.VERSION.SDK_INT >= 28 ? (int) p.getLongVersionCode() : p.versionCode;
            } catch (PackageManager.NameNotFoundException e) { return 0; }
        }

        /** «Да» в вопросе «Выйти из приложения?» (кнопка «Назад» на главной). */
        @JavascriptInterface
        public void exitApp() { runOnUiThread(MainActivity.this::finish); }

        /** Обычное меню «Поделиться» телефона: IMO, Telegram, WhatsApp и любые другие приложения. */
        @JavascriptInterface
        public void share(String text) {
            Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(send, "Поделиться объявлением"));
        }

        /** Приложение открыли по ссылке alphadrive://l/<id> — id объявления (страница спрашивает один раз при запуске). */
        @JavascriptInterface
        public String openedListing() {
            String id = listingId(getIntent());
            getIntent().setData(null);
            return id;
        }

        /** Приложение открыли нажатием на уведомление (страница спрашивает один раз при запуске). */
        @JavascriptInterface
        public boolean openedFromNotif() {
            boolean v = getIntent().getBooleanExtra("openNotifs", false);
            getIntent().removeExtra("openNotifs");
            return v;
        }
    }

    // Ссылка вида alphadrive://l/<id> → id объявления (только буквы, цифры и дефис)
    private static String listingId(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data == null || !"alphadrive".equals(data.getScheme()) || !"l".equals(data.getHost())) return "";
        String id = data.getLastPathSegment();
        return id != null && id.matches("[A-Za-z0-9-]{1,64}") ? id : "";
    }

    // Приложение уже открыто: нажали на уведомление или на ссылку объявления
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent.getBooleanExtra("openNotifs", false)) webView.evaluateJavascript("window.mbOpenNotifs && window.mbOpenNotifs()", null);
        String id = listingId(intent);
        if (!id.isEmpty()) webView.evaluateJavascript("window.mbOpenListing && window.mbOpenListing('" + id + "')", null);
    }

    private boolean openExternal(Uri uri) {
        String scheme = uri.getScheme();
        if ("file".equals(scheme)) return false;
        try {
            Intent intent = "tel".equals(scheme)
                ? new Intent(Intent.ACTION_DIAL, uri)
                : new Intent(Intent.ACTION_VIEW, uri);
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Нет приложения, чтобы открыть ссылку", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_PICK || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0) {
                result = new Uri[clip.getItemCount()];
                for (int i = 0; i < clip.getItemCount(); i++) result[i] = clip.getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{ data.getData() };
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    public void onBackPressed() {
        // «Назад» сначала закрывает окна и экраны внутри приложения
        webView.evaluateJavascript("(window.mbBack && window.mbBack()) ? 'yes' : 'no'", value -> {
            if (!"\"yes\"".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onPause() { super.onPause(); webView.onPause(); }

    @Override
    protected void onResume() { super.onResume(); webView.onResume(); }
}
