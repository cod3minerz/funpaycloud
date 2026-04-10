// Очистка строки от потенциально опасных символов
export function sanitizeInput(value: string): string {
  return value
    .replace(/[<>'"]/g, '') // XSS символы
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/gi, '') // SQL keywords
    .trim()
    .slice(0, 1000); // максимальная длина
}

// Валидация email
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Валидация пароля
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: 'Минимум 8 символов' };
  return { valid: true };
}

// Валидация golden_key
export function validateGoldenKey(key: string): boolean {
  return /^[a-zA-Z0-9]{20,64}$/.test(key);
}
