import fetch from 'isomorphic-unfetch'
const apiBase = 'http://localhost:3000'

export async function request(
  input: RequestInfo,
  init?: RequestInit
) {
  try {
    const url = `${apiBase}/${input}`
    const data = await fetch(url, init).then(res => res.json())
    return data
  } catch (err) {
    throw new Error(err.message)
  }
}
