/** Nome de usuário do Last.fm: 2–15 caracteres, começa com letra; letras, números, "_" e "-". */
const USERNAME = /^[a-zA-Z][\w-]{1,14}$/;

export function isValidLastfmUsername(value: unknown): value is string {
  return typeof value === "string" && USERNAME.test(value);
}
