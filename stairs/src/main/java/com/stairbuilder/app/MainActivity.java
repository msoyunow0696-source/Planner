package com.stairbuilder.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF1A1A2E);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // запоминание параметров лестницы
        s.setAllowFileAccess(true);
        s.setTextZoom(100);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    @Override
    public void onBackPressed() {
        // «Назад» сначала закрывает панель или чертежи, потом выходит
        webView.evaluateJavascript(
            "(function(){var v=document.getElementById('views2d');" +
            "if(v&&v.classList.contains('show')){document.getElementById('btnViews').click();return true;}" +
            "var p=document.getElementById('panel');" +
            "if(p&&!p.classList.contains('collapsed')&&window.innerWidth<=900){document.getElementById('panelClose').click();return true;}" +
            "return false;})()",
            value -> {
                if (!"true".equals(value)) MainActivity.super.onBackPressed();
            });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
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
