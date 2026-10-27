package com.mytasks.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private static final int REQ_PICK_FILE = 1001;
    private static final int REQ_SAVE_FILE = 1002;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingSaveContent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF0F172A);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // localStorage — здесь хранятся задачи
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            // Кнопка «Импорт»: выбор JSON-файла
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(intent, "Выберите файл"), REQ_PICK_FILE);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.addJavascriptInterface(new Bridge(), "Android");

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    /** Мост для JavaScript: сохранение файла (кнопка «Экспорт»). */
    private class Bridge {
        @JavascriptInterface
        public void saveFile(final String fileName, final String content) {
            runOnUiThread(() -> {
                pendingSaveContent = content;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, fileName);
                try {
                    startActivityForResult(intent, REQ_SAVE_FILE);
                } catch (Exception e) {
                    pendingSaveContent = null;
                    Toast.makeText(MainActivity.this, "Не удалось открыть сохранение", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQ_PICK_FILE) {
            if (fileCallback == null) return;
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{ data.getData() };
            }
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        } else if (requestCode == REQ_SAVE_FILE) {
            String content = pendingSaveContent;
            pendingSaveContent = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null || content == null) return;
            try (OutputStream os = getContentResolver().openOutputStream(data.getData())) {
                if (os != null) os.write(content.getBytes(StandardCharsets.UTF_8));
                Toast.makeText(this, "Файл сохранён", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Ошибка сохранения", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        // Если открыто окно категорий — закрыть его, иначе выйти
        webView.evaluateJavascript(
            "(function(){var m=document.getElementById('catModal');" +
            "if(m&&m.classList.contains('open')){m.classList.remove('open');return true;}return false;})()",
            value -> {
                if (!"true".equals(value)) MainActivity.super.onBackPressed();
            });
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }
}
