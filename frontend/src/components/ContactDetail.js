import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:3001/api/contacts/${id}`).then(res => {
      setContact(res.data);
      setFormData(res.data);
    }).catch(err => navigate('/contacts'));
  }, [id, navigate]);

  if (!contact) return <div>Loading...</div>;

  const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};


  const handleSave = async () => {
    if (!validateEmail(formData.email)) {
      alert('Invalid email format');
      return;
    }
    
    try {
      await axios.put(`http://localhost:3001/api/contacts/${id}`, { ...formData, last_modified: contact.last_modified });
      setContact({ ...contact, ...formData });
      setEditMode(false);
    } catch (error) {
      if (error.response?.status === 409) {
        alert('Conflict: Contact modified by another user. Please refresh.');
      } else {
        alert(error.response?.data?.error || 'Update failed');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this contact?')) {
      await axios.delete(`http://localhost:3001/api/contacts/${id}`);
      navigate('/contacts');
    }
  };
  
  console.log(contact);
  return (
    <div>
      <h2>Contact Detail</h2>
      {editMode ? (
        <form>
        {/* {Object.keys(contact).map((key, index) => (
    <div className="mb-3" key={index}>
      <label className="form-label">{key}</label>
      <input
        className="form-control"
        name={key}
        value={formData[key] || ''}
        onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })}
      />
    </div>
  ))} */}
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" name="name" value={formData.name} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" name="email" value={formData.email} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input className="form-control" type="number" name="phone_number" maxLength="10" value={formData.phone_number} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
          </div>
          <button type="button" className="btn btn-primary me-2" onClick={handleSave}>Save</button>
          <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(false); setFormData(contact); }}>Cancel</button>
        </form>
      ) : (
        <div>
          <p><strong>Name:</strong> {contact.name}</p>
          <p><strong>Email:</strong> {contact.email}</p>
          <p><strong>Phone:</strong> {contact.phone_number}</p>
          <button className="btn btn-primary me-2" onClick={() => setEditMode(true)}>Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}

export default ContactDetail;