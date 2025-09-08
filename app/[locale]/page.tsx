export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  return (
    <div>
      <h1>Hello World - Aseedak Game</h1>
      <p>This is a test page to see if routing works.</p>
      <p>Current locale: {locale}</p>
    </div>
  )
}