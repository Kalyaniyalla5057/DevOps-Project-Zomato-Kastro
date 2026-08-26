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
      <Card />
      <h2>Developer 1 - Special Offers</h2>
      <h2>Developer 2 - Special Offers</h2>
      <Collection />
      <Cities />
      <CTA />
      <AccContainer />
      <h2>Advanced Git Demo - Developer 2</h2>
      <Footer />
    </div>
  );
}

export default App;