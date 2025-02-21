import React, { useState } from 'react';
import axios from 'axios';
import * as xlsx from 'xlsx';

function UploadContacts() {
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    console.log(file);
    if (!file || !/\.(xlsx|xls)$/.test(file.name)) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3001/api/contacts/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Upload successful:', response.data);
      alert('File uploaded successfully!');
      console.log(response);
      const processedRows = response.data.data || [];
      const validData = processedRows.filter(row => !row.errors || row.errors.length === 0);
      const validationErrors = processedRows.filter(row => row.errors && row.errors.length > 0);
      setData(validData);
      setErrors(validationErrors);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file.');
    }
    
  };

  const handleUpload = async () => {
    if (data.length === 0) return alert('No valid data to upload');
    try {
      const response = await axios.post('http://localhost:3001/api/contacts/upload', data);
      console.log(response)
      const { inserted, failed, failures } = response.data;
      alert(`Uploaded ${inserted} contacts. ${failed} failed.`);
      if (failed > 0) setErrors(failures);
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDownloadErrors = async () => {
    try {
    const response = await axios.post(
      'http://localhost:3001/api/contacts/download',
      errors, 
      { responseType: 'blob' } 
    );
    console.log(response);
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `error-${new Date().toLocaleString('en-GB').replace(/\//g, '-')}.xlsx`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading error report:', error);
    alert('Error downloading error report.');
  }
  };
  console.log(data);
  console.log(errors);

  return (
    <div>
      <h2>Upload Contacts</h2>
      <input type="file" accept=".xlsx,.xls" className="form-control mb-3" onChange={handleFileChange} />
      {errors.length > 0 && (
        <>
          <h4>Invalid Rows:</h4>
          <ul className="list-group mb-3">
            {errors.map((e, i) => (
              <li key={i} className="list-group-item">Row {e.row}: {e.errors.type === Array ? e.errors?.join(", "): e.errors }</li>
            ))}
          </ul>
          <button className="btn btn-secondary mb-3" onClick={handleDownloadErrors}>Download Error Report</button>
        </>
      )}
      <button className="btn btn-primary mb-3 ms-3" onClick={handleUpload} disabled={data.length === 0}>Upload Valid Contacts</button>
    </div>
  );
}

export default UploadContacts;