package com.example.umarket.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String remitente;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean enviarCodigoVerificacion(String destinatario, String nombre, String codigo) {
        log.info("==========================================================");
        log.info("📧 [SERVICIO DE CORREO U-MARKET UTP]");
        log.info("Destinatario: {}", destinatario);
        log.info("Estudiante:   {}", nombre);
        log.info("CÓDIGO OTP:   {}", codigo);
        log.info("Vigencia:     10 minutos");
        log.info("==========================================================");

        // Si no hay remitente configurado en application.properties, operar en modo sandbox/consola
        if (remitente == null || remitente.trim().isEmpty()) {
            log.info("ℹ️ [MODO SANDBOX / ACADÉMICO]: No se ha configurado cuenta SMTP. Código impreso en consola.");
            return true;
        }

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(remitente, "U-Market UTP");
            helper.setTo(destinatario);
            helper.setSubject("🔑 Tu código de verificación U-Market UTP: " + codigo);

            String contenidoHtml = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 28px; font-weight: 900; color: #0056D2; letter-spacing: -1px;">U-Market UTP</span>
                        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Mercado Universitario de Estudiantes</p>
                    </div>
                    
                    <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 12px;">¡Hola, %s!</h2>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
                        Para validar tu cuenta y confirmar que eres estudiante activo de la UTP, ingresa el siguiente código de verificación en el formulario de registro:
                    </p>
                    
                    <div style="background-color: #f3f4f6; border: 2px dashed #0056D2; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0056D2;">%s</span>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 13px; line-height: 1.4;">
                        ⏱️ Este código es válido por <strong>10 minutos</strong>. Si tú no solicitaste este código, puedes ignorar este mensaje.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                    
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                        Universidad Tecnológica del Perú • U-Market 2026
                    </p>
                </div>
            """.formatted(nombre != null ? nombre : "Estudiante", codigo);

            helper.setText(contenidoHtml, true);
            mailSender.send(mensaje);
            log.info("✅ Correo real enviado exitosamente a {}", destinatario);
            return true;
        } catch (Exception e) {
            log.warn("⚠️ No se pudo enviar el correo real por SMTP ({}). El código {} sigue siendo válido en modo demo.", e.getMessage(), codigo);
            return true;
        }
    }
}
