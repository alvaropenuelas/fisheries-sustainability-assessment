import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Hero from './sections/Hero'
import KobePlot from './sections/KobePlot'
import KobeTrajectory from './sections/KobeTrajectory'
import ProxyScatter from './sections/ProxyScatter'
import SpeciesCards from './sections/SpeciesCards'
import StatusBreakdown from './sections/StatusBreakdown'
import StockRanking from './sections/StockRanking'
import Methods from './sections/Methods'
import Footer from './sections/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <div className="min-h-screen" style={{ paddingTop: '56px' }}>
        <Hero />
        <KobePlot />
        <KobeTrajectory />
        <ProxyScatter />
        <SpeciesCards />
        <StatusBreakdown />
        <StockRanking />
        <Methods />
        <Footer />
      </div>
    </ThemeProvider>
  )
}
