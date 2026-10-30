package com.mashynbazar.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

/**
 * Фоновая проверка уведомлений, когда приложение закрыто.
 * Android запускает её примерно раз в 15 минут (чаще не разрешает),
 * она спрашивает у Supabase новые непрочитанные уведомления этого телефона и показывает их.
 */
public class NotifyJob extends JobService {

    static final String SB_URL = "https://qjllrvbkwglgcnxteenx.supabase.co";
    static final String SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbGxydmJrd2dsZ2NueHRlZW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyOTg3NjQsImV4cCI6MjEwODg3NDc2NH0.sg3XKEJZhXAf6n9cR3PvMQXTFpbXID3wNEB3lr7a9Ao";
    private static final int JOB_ID = 3001;
    private static final String CHANNEL = "mb_notifs";
    private static final String PREFS = "mb_notify";

    // ====== Управление из приложения ======

    /** Секретный ключ этого телефона: по нему база отдаёт уведомления его владельца. */
    static String deviceKey(Context c) {
        SharedPreferences p = c.getSharedPreferences(PREFS, MODE_PRIVATE);
        String key = p.getString("key", null);
        if (key == null) {
            byte[] b = new byte[24];
            new SecureRandom().nextBytes(b);
            StringBuilder sb = new StringBuilder();
            for (byte x : b) sb.append(String.format("%02x", x));
            key = sb.toString();
            p.edit().putString("key", key).apply();
        }
        return key;
    }

    static void enable(Context c, long since) {
        SharedPreferences p = c.getSharedPreferences(PREFS, MODE_PRIVATE);
        if (p.getLong("since", 0) < since) p.edit().putLong("since", since).apply();
        JobInfo job = new JobInfo.Builder(JOB_ID, new ComponentName(c, NotifyJob.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPeriodic(15 * 60 * 1000L)
            .setPersisted(true)   // продолжает работать после перезагрузки телефона
            .build();
        c.getSystemService(JobScheduler.class).schedule(job);
    }

    static void disable(Context c) {
        c.getSystemService(JobScheduler.class).cancel(JOB_ID);
    }

    /** Приложение открыто и уведомления видны в нём — в фоне их больше не показываем. */
    static void markSeen(Context c, long time) {
        SharedPreferences p = c.getSharedPreferences(PREFS, MODE_PRIVATE);
        if (p.getLong("since", 0) < time) p.edit().putLong("since", time).apply();
    }

    // ====== Сама проверка ======

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            try { check(); } catch (Exception ignored) {}
            jobFinished(params, false);
        }).start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) { return true; }

    private void check() throws Exception {
        SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
        long since = p.getLong("since", System.currentTimeMillis());

        HttpURLConnection http = (HttpURLConnection) new URL(SB_URL + "/rest/v1/rpc/mb_device_notifs").openConnection();
        http.setRequestMethod("POST");
        http.setConnectTimeout(15000);
        http.setReadTimeout(15000);
        http.setRequestProperty("apikey", SB_KEY);
        http.setRequestProperty("Authorization", "Bearer " + SB_KEY);
        http.setRequestProperty("Content-Type", "application/json");
        http.setDoOutput(true);
        JSONObject body = new JSONObject().put("p_key", deviceKey(this)).put("p_since", since);
        try (OutputStream out = http.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
        if (http.getResponseCode() != 200) return;

        String json;
        try (InputStream in = http.getInputStream()) {
            java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            for (int r; (r = in.read(chunk)) > 0; ) buf.write(chunk, 0, r);
            json = buf.toString("UTF-8");
        }
        JSONArray list = new JSONArray(json);
        if (list.length() == 0) return;

        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Уведомления Alpha Drive", NotificationManager.IMPORTANCE_DEFAULT));
        PendingIntent open = PendingIntent.getActivity(this, 0,
            new Intent(this, MainActivity.class).putExtra("openNotifs", true).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        long newest = since;
        for (int i = 0; i < list.length(); i++) {
            JSONObject n = list.getJSONObject(i);
            newest = Math.max(newest, n.optLong("n_time"));
            Notification note = new Notification.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("Alpha Drive")
                .setContentText(n.optString("n_text"))
                .setStyle(new Notification.BigTextStyle().bigText(n.optString("n_text")))
                .setContentIntent(open)
                .setAutoCancel(true)
                .build();
            nm.notify(n.optString("n_id").hashCode(), note);
        }
        p.edit().putLong("since", newest).apply();
    }
}
