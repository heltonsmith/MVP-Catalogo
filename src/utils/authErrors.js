/**
 * Translates Supabase authentication error messages to Spanish.
 * @param {string} English message or error object
 * @returns {string} Spanish translated message
 */
export const translateAuthError = (error) => {
    if (!error) return "Ocurrió un error inesperado";

    const message = typeof error === 'string' ? error : (error.message || "");

    // Auth errors
    if (message.includes("Invalid login credentials")) {
        return "Credenciales de acceso inválidas. Por favor, verifica tu email y contraseña.";
    }
    if (message.includes("User already registered") || message.includes("User already exists")) {
        return "Este correo ya se encuentra registrado.";
    }
    if (message.includes("Password should be at least")) {
        return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (message.includes("Email not confirmed")) {
        return "El correo electrónico no ha sido confirmado.";
    }
    if (message.includes("Check your email for the confirmation link")) {
        return "Por favor, revisa tu correo para el enlace de confirmación.";
    }
    if (message.includes("Too many requests") || message.includes("rate limit exceeded")) {
        return "Límite de correos excedido. Por favor, espera unos minutos e inténtalo de nuevo.";
    }
    if (message.includes("Network request failed")) {
        return "Error de red. Verifica tu conexión a internet.";
    }
    if (message.includes("Database error saving new user")) {
        return "Error al guardar el usuario. Por favor, contacta a soporte.";
    }
    if (message.includes("Signup is disabled")) {
        return "El registro está deshabilitado temporalmente.";
    }
    if (message.includes("Invalid format for email")) {
        return "El formato del correo electrónico no es válido.";
    }
    if (message.includes("bloqueada por el administrador")) {
        return message; // Already in Spanish from AuthContext
    }

    if (message.includes("Error sending recovery email") || message.includes("Error sending confirmation mail")) {
        return "Error al enviar el correo. Por favor, verifica la configuración de SMTP o inténtalo más tarde.";
    }
    // Default error mapping if no specific match
    console.warn("Untranslated auth error:", message);
    return "Ocurrió un problema con la autenticación. Por favor, inténtalo de nuevo.";
};
