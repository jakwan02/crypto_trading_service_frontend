let accessToken = "";

export function getAcc(): string {
  return accessToken;
}

export function setAcc(token: string): void {
  accessToken = token;
}

export function clearAcc(): void {
  accessToken = "";
}
