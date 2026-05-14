const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL

//  ESCREVE UMA LINHA //
export async function appendSheet(range: string, values: string[][]): Promise<void> {
  const aba = range.split('!')[0]

  await fetch(APPS_SCRIPT_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify({ aba, linha: values[0] }),
  })
}

//  LÊ DADOS DE UMA ABA //
export async function readSheet(range: string): Promise<string[][]> {
  const aba = range.split('!')[0]

  const res  = await fetch(`${APPS_SCRIPT_URL}?aba=${aba}`)
  const data = await res.json()

  return data.data ?? []
}

export async function writeSheet(_range: string, _values: string[][]): Promise<void> {
  console.warn('writeSheet: use appendSheet para inserir dados')
}