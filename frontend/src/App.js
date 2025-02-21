import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ContactsList from './components/ContactsList';
import ContactDetail from './components/ContactDetail';
import UploadContacts from './components/UploadContacts';

function App() {
  return (
    <Router>
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <a className="navbar-brand" href="/">Contact Book</a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              <li className="nav-item"><a className="nav-link" href="/contacts">Contacts</a></li>
              <li className="nav-item"><a className="nav-link" href="/upload">Upload</a></li>
            </ul>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<ContactsList />} />
          <Route path="/contacts" element={<ContactsList />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/upload" element={<UploadContacts />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;