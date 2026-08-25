import Header from "./components/Header/Header";
import "./app.scss";
import Footer from "./components/Footer/Footer";
import AccContainer from "./components/AccContainer/AccContainer";
import CTA from "./components/CTA/CTA";
import Cities from "./components/Cities/Cities";
import Collection from "./components/Collections/Collection";
import Card from "./components/Card/Card";

function App() {
  return (
    <div className="App">
      <Header />

      <h2>🚨 PRODUCTION BUG - Broken Feature</h2>

      <Card />

      <h2>Developer 1 - Header and Navigation Update</h2>

      <h2>Developer 3 - Restaurant Collection Update</h2>

      <h2>Developer 2 - Food Discovery Update</h2>

      <h2>Developer 4 - Restaurant experience Update</h2>

      <Card />

      <Collection />
      <Cities />
      <CTA />
      <AccContainer />
      <Footer />
    </div>
  );
}

export default App;