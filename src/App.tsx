import { useLayoutEffect } from 'react'
import { GameProvider } from './ui/bridge/GameProvider'
import Level01Scene from './ui/level-01/Level01Scene'
import styles from './App.module.css'

const GAME_WIDTH = 1280
const GAME_HEIGHT = 896

function App() {
  useLayoutEffect(() => {
    const updateScale = () => {
      const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)
      document.documentElement.style.setProperty('--game-scale', String(scale))
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return (
    <div className={styles.scaleShell}>
      <div className={styles.viewport}>
        <GameProvider>
          <Level01Scene />
        </GameProvider>
      </div>
    </div>
  )
}

export default App
