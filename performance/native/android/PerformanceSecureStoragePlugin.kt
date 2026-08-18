package com.paradise.performance

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

@CapacitorPlugin(name = "PerformanceSecureStorage")
class PerformanceSecureStoragePlugin : Plugin() {
    private val prefsName = "ParadisePerformanceSecureSession"
    private val keyAlias = "ParadisePerformanceSessionAesKey"
    private val transformation = "AES/GCM/NoPadding"

    @PluginMethod
    fun getItem(call: PluginCall) {
        val key = requiredKey(call) ?: return
        val encoded = preferences().getString(key, null)
        if (encoded == null) {
            call.resolve(JSObject().put("value", null))
            return
        }
        try {
            val parts = encoded.split(':', limit = 2)
            require(parts.size == 2) { "Malformed protected session value" }
            val iv = Base64.decode(parts[0], Base64.NO_WRAP)
            val ciphertext = Base64.decode(parts[1], Base64.NO_WRAP)
            val cipher = Cipher.getInstance(transformation)
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(128, iv))
            val plaintext = cipher.doFinal(ciphertext).toString(Charsets.UTF_8)
            call.resolve(JSObject().put("value", plaintext))
        } catch (error: Exception) {
            call.reject("Unable to read protected session value", error)
        }
    }

    @PluginMethod
    fun setItem(call: PluginCall) {
        val key = requiredKey(call) ?: return
        val value = call.getString("value")
        if (value == null) {
            call.reject("value is required")
            return
        }
        try {
            val cipher = Cipher.getInstance(transformation)
            cipher.init(Cipher.ENCRYPT_MODE, secretKey())
            val ciphertext = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
            val encoded = Base64.encodeToString(cipher.iv, Base64.NO_WRAP) + ":" +
                Base64.encodeToString(ciphertext, Base64.NO_WRAP)
            preferences().edit().putString(key, encoded).apply()
            call.resolve()
        } catch (error: Exception) {
            call.reject("Unable to store protected session value", error)
        }
    }

    @PluginMethod
    fun removeItem(call: PluginCall) {
        val key = requiredKey(call) ?: return
        preferences().edit().remove(key).apply()
        call.resolve()
    }

    private fun requiredKey(call: PluginCall): String? {
        val key = call.getString("key")
        if (key.isNullOrBlank()) {
            call.reject("key is required")
            return null
        }
        return key
    }

    private fun secretKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        val existing = keyStore.getKey(keyAlias, null) as? SecretKey
        if (existing != null) return existing

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        val spec = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }

    private fun preferences() = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
}
