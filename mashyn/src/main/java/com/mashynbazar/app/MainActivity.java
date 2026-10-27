package com.mashynbazar.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final int REQ_PICK = 2001;

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

        webView.setWebViewClient(new WebViewClient() {
            // Звонки, WhatsApp и внешние сайты открываем в других приложениях телефона
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternal(request.getUrl());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            // Выбор фото для объявления (можно несколько)
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(intent, "Выберите фото"), REQ_PICK);
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
