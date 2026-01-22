export default function authFetch(url: string, options: any = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  }).then(res => res.ok ? res.json() : Promise.reject(res));
}

export { authFetch };