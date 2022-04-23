import { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import styled from 'styled-components'
import { PaperForm } from './components/PaperForm'

const FormContainer = styled.div`
  width: 80vw;
  height: 60vh;
  margin: 40px auto;
`

const Text = styled.div`
  position: absolute;
  color: red;
  font-weight: bold;
  line-height: 1;
  text-align: center;
`

const texts = [
  {id: 0, top: 10, left: 10, text: 'aaa' }
]

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <FormContainer>
        <PaperForm src="/src/logo.svg" untouchable={<>{texts.map(t => <Text key={t.id} style={{top: `${t.top}px`, left: `${t.left}px`}}>{t.text}</Text>)}</>}/>
      </FormContainer>
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
