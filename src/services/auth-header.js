export default function authHeader() {
  const token = localStorage.getItem('auth.accessToken');
  if (token) {
    return { 
      Authorization: 'Bearer ' + token, 
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json'
    };
  }
  return {};
}