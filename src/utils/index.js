import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export * from './images';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
    }).format(value);
}

export function generateWhatsAppLink(phone, message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}

export function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

export function validateRut(rut) {
    if (!rut) return false;
    // Clean string: remove dots and dash, uppercase K
    let clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (clean.length < 8) return false;

    let dv = clean.slice(-1);
    let num = clean.slice(0, -1);

    // Validate only numbers in the body
    if (!/^\d+$/.test(num)) return false;

    // Reject repetitive patterns (11111111, 22222222, etc)
    if (/^(\d)\1+$/.test(num)) return false;

    let sum = 0;
    let mul = 2;

    for (let i = num.length - 1; i >= 0; i--) {
        sum += parseInt(num.charAt(i)) * mul;
        mul = mul === 7 ? 2 : mul + 1;
    }

    let res = 11 - (sum % 11);
    let expectedDv = res === 11 ? '0' : res === 10 ? 'K' : res.toString();

    return dv === expectedDv;
}

export function formatRut(rut) {
    if (!rut) return '';
    // Extract only alphanumeric chars
    let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!clean) return '';

    if (clean.length < 2) return clean;

    let dv = clean.slice(-1);
    let num = clean.slice(0, -1);

    // Add thousands separator to the numbers part
    let formattedNum = num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return formattedNum + '-' + dv;
}

export function formatPhone(value) {
    if (!value) return '+56';

    // If it doesn't start with +, add it
    let cleaned = value;
    if (!value.startsWith('+')) {
        cleaned = '+' + value.replace(/\D/g, '');
    } else {
        cleaned = '+' + value.slice(1).replace(/\D/g, '');
    }

    // Force +56 prefix
    if (!cleaned.startsWith('+56')) {
        // If the user typed just digits, prepend +56
        const digits = value.replace(/\D/g, '');
        if (digits.startsWith('56')) {
            cleaned = '+' + digits;
        } else {
            cleaned = '+56' + digits;
        }
    }

    // Limit to 12 chars (+569XXXXXXXX)
    return cleaned.slice(0, 12);
}

export function validatePhone(phone) {
    if (!phone) return false;
    // Format: +56 XXXXXXXXX (12 chars total)
    // The user clarified that '9' is not mandatory immediately after +56
    return /^\+56\d{9}$/.test(phone);
}

export function isValidUrl(url) {
    if (!url) return true; // Links are optional
    return url.startsWith('https://');
}

export function titleCase(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function cleanTextInput(text, maxLength = 255) {
    if (!text) return '';
    return text.toString().trim().slice(0, maxLength);
}
