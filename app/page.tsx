export default function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Signature - Trust Badge API</h1>
      <p>AI-powered contract analysis and validation system</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Badge Endpoints</h2>
        <ul>
          <li>
            <code>/badge/[username]</code> - Get trust badge for a user
          </li>
          <li>
            <code>/badge/[username].svg</code> - Get trust badge with .svg extension
          </li>
        </ul>
        
        <h3>Examples</h3>
        <ul>
          <li>
            <a href="/badge/johndoe">/badge/johndoe</a>
          </li>
          <li>
            <a href="/badge/johndoe.svg">/badge/johndoe.svg</a>
          </li>
        </ul>
      </div>
    </div>
  )
}