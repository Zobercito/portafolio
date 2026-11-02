export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
}

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactValidationError';
  }
}

export function validateContactPayload(input: unknown): ContactPayload {
  if (typeof input !== 'object' || input === null) {
    throw new ContactValidationError('Faltan campos requeridos');
  }

  const { name, email, message, turnstileToken } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    throw new ContactValidationError('El nombre es requerido');
  }
  if (typeof email !== 'string' || !email.trim()) {
    throw new ContactValidationError('El correo es requerido');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new ContactValidationError('El mensaje es requerido');
  }
  if (typeof turnstileToken !== 'string' || !turnstileToken.trim()) {
    throw new ContactValidationError('Token de Turnstile requerido');
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (trimmedName.length > MAX_NAME_LENGTH) {
    throw new ContactValidationError(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`);
  }
  if (trimmedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)) {
    throw new ContactValidationError('Correo electrónico inválido');
  }
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    throw new ContactValidationError(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres`);
  }

  return {
    name: trimmedName,
    email: trimmedEmail,
    message: trimmedMessage,
    turnstileToken: turnstileToken.trim(),
  };
}
