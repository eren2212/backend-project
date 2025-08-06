export function isValidPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) && // büyük harf
    /[a-z]/.test(password) && // küçük harf
    /[0-9]/.test(password) && // rakam
    /[^A-Za-z0-9]/.test(password) // özel karakter
  );
}
