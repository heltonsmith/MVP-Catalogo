/**
 * Translates Supabase authentication error messages to Spanish.
 * @param {string} English message or error object
 * @returns {string} Spanish translated message
 */
export const translateAuthError = (error) => {
    if (!error) return "Ocurrió un error inesperado";

    const message = typeof error === 'string' ? error : (error.message || "");

    // Auth errors
    if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
        return "Credenciales de acceso inválidas. Por favor, verifica tu email y contraseña.";
    }
    if (message.includes("User already registered") || message.includes("User already exists") || message.includes("already registered")) {
        return "Este correo ya se encuentra registrado.";
    }
    if (message.includes("Password should be at least")) {
        return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (message.includes("Email not confirmed")) {
        return "El correo electrónico no ha sido confirmado. Por favor, revisa tu bandeja de entrada.";
    }
    if (message.includes("Check your email for the confirmation link")) {
        return "Por favor, revisa tu correo para el enlace de confirmación.";
    }
    if (message.includes("Too many requests") || message.includes("rate limit exceeded")) {
        return "Límite de intentos excedido. Por favor, espera unos minutos e inténtalo de nuevo.";
    }
    if (message.includes("Network request failed")) {
        return "Error de red. Verifica tu conexión a internet.";
    }
    if (message.includes("Database error saving new user")) {
        return "Error al guardar el usuario en la base de datos. Por favor, contacta a soporte.";
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

    // Database / Constraint errors
    if (message.includes("duplicate key value") || message.includes("already exists")) {
        if (message.includes("companies_slug_key")) return "Ya existe una tienda con un nombre similar. Por favor, intenta con otro nombre.";
        return "Ya existe un registro con estos datos.";
    }
    if (message.includes("violates foreign key constraint")) {
        return "Error de referencia en la base de datos.";
    }

    if (message.includes("Error sending recovery email") || message.includes("Error sending confirmation mail")) {
        return "Error al enviar el correo. Por favor, verifica tu email o inténtalo más tarde.";
    }

    // Default error mapping if no specific match
    console.warn("Untranslated error:", message);
    if (!message) return "Ocurrió un problema inesperado. Por favor, inténtalo de nuevo.";

    // If message is already in Spanish or very short, return it
    if (message.length < 50 && /[áéíóúñ]/i.test(message)) return message;

    return `Error: ${message}. Por favor, verifica los datos e inténtalo de nuevo.`;
};
