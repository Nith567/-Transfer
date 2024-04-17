import styles from './page.module.css'
import { ethers } from 'ethers'
export default function Home() {

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p>
            Head to{' '}
            <a
              href="/api/dev"
              style={{ display: 'inline', fontWeight: 'semibold' }}
            >
              <code className={styles.code}>localhost:3000/api</code>
            </a>{' '}
          for frame endpoint
          </p>
        </div>
      </div>
      <div className={styles.center}>
        <div>
          <h1>USDC GOAT Contributions</h1>
        </div>
      </div>
    </main>
  )
}
