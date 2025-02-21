import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as xlsx from 'xlsx';

function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const limit = 10;

  useEffect(() => {
    fetchContacts();
  }, [page, search, sortBy, order ]);
  const fetchContacts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/contacts', {
        params: { page, limit, search, sortBy, order }
      });
      setContacts(response.data.contacts);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

const fetchAllContacts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/contacts', {
        params: { page, limit:total, search, sortBy, order }
      });
      return response.data.contacts;
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
    setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  } else {
    setSortBy(field);
    setOrder('asc');
  }
  };

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelected(selected.length === contacts.length ? [] : contacts.map(c => c.id));
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    if (window.confirm('Delete selected contacts?')) {
      await axios.delete('http://localhost:3001/api/contacts', { data: { ids: selected } });
      setSelected([]);
      fetchContacts();
    }
  };

  const handleExport = async () => {
   
    try {
    const dataToExport = selected.length === 0 ? await fetchAllContacts() : contacts.filter(c => selected.includes(c.id));
    console.log(dataToExport);
    const response = await axios.post(
      'http://localhost:3001/api/contacts/download',
      dataToExport, 
      { responseType: 'blob' } 
    );
    console.log(response);
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export-${new Date().toLocaleString('en-GB').replace(/\//g, '-')}.xlsx`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading error report:', error);
    alert('Error downloading error report.');
  }
  };

  const handleSingleDelete = async (id) => {
    if (window.confirm('Delete selected contacts?')) {
      await axios.delete(`http://localhost:3001/api/contacts/${id}`, { data: { ids: selected } });
      fetchContacts();
      if (selected.includes(id)) {
      setSelected(prev => prev.filter(x => x !== id));
      }
    }
  }
  console.log('Data',selected , sortBy , order)

  return (
    <div>
      <h2>Contacts</h2>
      <input type="text" className="form-control mb-3" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      <table className="table table-striped">
        <thead>
          <tr >
            <th style={{ cursor: 'pointer' }} ><input type="checkbox" onChange={handleSelectAll} checked={selected.length === contacts.length} /></th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}><span>Name</span>
      <span style={{ marginLeft: '5px' }}>
        {sortBy === 'name' && (order === 'asc' ? '▲' : '▼')}
      </span></th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>Email {sortBy === 'email' && (order === 'asc' ? '▲' : '▼')}</th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('phone_number')}>Phone {sortBy === 'phone_number' && (order === 'asc' ? '▲' : '▼')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id}>
              <td><input type="checkbox" checked={selected.includes(c.id)} onChange={() => handleSelect(c.id)} /></td>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone_number}</td>
              <td>
                <a href={`/contacts/${c.id}`} className="btn btn-sm btn-info me-2">View</a>
                <button className="btn btn-sm btn-danger" onClick={() => {handleSingleDelete(c.id)}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex justify-content-between">
        <div>
          <button className="btn btn-danger me-2" onClick={handleDelete} disabled={selected.length === 0}>Delete Selected</button>
          <button className="btn btn-success" onClick={handleExport}>{selected.length === 0 ? "Export All" : "Export"}</button>
        </div>
        <div>
          <button className="btn btn-primary me-2" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <button className="btn btn-primary ms-2" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default ContactsList;