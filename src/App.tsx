import { useState } from 'react'
import styled from 'styled-components'
import './App.css'
import { PaperViewer } from './components/PaperViewer'
import logo from './logo.svg'

const Container = styled.div`
  width: 80vw;
  height: 60vh;
  margin: 40px auto;
`

const Text = styled.div`
  position: absolute;
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  color: red;
  text-align: center;
`

const texts = [{ id: 0, top: 20, left: 20, text: 'sample text' }]

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <Container>
        <PaperViewer src="/src/frourio.png">
          {texts.map((t) => (
            <Text key={t.id} style={{ top: `${t.top}px`, left: `${t.left}px` }}>
              {t.text}
            </Text>
          ))}
        </PaperViewer>
      </Container>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  )
}

export default App
