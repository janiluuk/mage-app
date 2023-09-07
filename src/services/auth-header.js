export default function authHeader() {
    let user = localStorage.getItem('auth.accessToken');
    if (user) {
      return { Authorization: 'Bearer ' + user, 
                'Accept' : 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json'};
    } else {
      return {};
    }
  }