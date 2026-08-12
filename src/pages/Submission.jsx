import { useState } from 'react';
import SubmissionMap from '../components/SubmissionMap';
import { uploadPhoto, createPlantingRecord } from '../lib/records';

export default function Submission() {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [treeCount, setTreeCount] = useState('');
  const [community, setCommunity] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!location || !photo || !treeCount || !community) {
      alert('Please fill in location, photo, tree count, and community before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const photoUrl = await uploadPhoto(photo);
      await createPlantingRecord({ photoUrl, lat: location.lat, lng: location.lng, description, community, treeCount: Number(treeCount) });
      alert('Submitted! Pending admin review.');
      setLocation(null); setPhoto(null); setTreeCount(''); setCommunity(''); setDescription('');
    } catch (err) {
      alert('Submit failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submission-page">
      <section className="submission-intro">
        <span className="role-pill">Community Member</span>
        <h1>Submit a Planting Record</h1>
        <p>Document your tree-planting activity with GPS evidence, photos, and site details. All submissions are reviewed before payment is processed.</p>
      </section>
      <form className="planting-form" onSubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
        <div className="form-section">
          <span className="field-label">GPS Location</span>
          <p className="field-help">Tap on the map to drop a pin at your planting site.</p>
          <SubmissionMap location={location} onLocationSelect={setLocation} />
          <p className="coordinate-readout" aria-live="polite">{location ? `${location.lat.toFixed(5)}°, ${location.lng.toFixed(5)}°` : 'Select a location on the map'}</p>
        </div>
        <div className="form-section">
          <label className="field-label" htmlFor="site-photo">Site Photo</label>
          <p className="field-help">Upload a photo showing the planting activity.</p>
          <label className={`photo-dropzone${photo ? ' has-file' : ''}`} htmlFor="site-photo">
            <span className="photo-icon" aria-hidden="true">▣</span>
            <span className="photo-prompt">{photo ? photo.name : 'Click to upload photo'}</span>
            <span className="photo-note">JPG, PNG or WEBP — max 20MB</span>
            <input id="site-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="form-section">
          <label className="field-label" htmlFor="tree-count">Number of Trees</label>
          <p className="field-help">Enter the total number of trees planted at this site.</p>
          <input id="tree-count" type="number" min="1" value={treeCount} onChange={(e) => setTreeCount(e.target.value)} placeholder="e.g. 120" required />
        </div>
        <div className="form-section">
          <label className="field-label" htmlFor="community">Community / Site</label>
          <p className="field-help">Name the community or site location.</p>
          <input id="community" type="text" value={community} onChange={(e) => setCommunity(e.target.value)} placeholder="e.g. Chibombo Site A" required />
        </div>
        <div className="form-section">
          <label className="field-label" htmlFor="description">Description</label>
          <p className="field-help">Describe the planting activity — species, methods, community involvement.</p>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Native miombo woodland restoration along the Kafue headwaters, involving community members..." />
        </div>
        <button className="submit-record-button" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Planting Record'}</button>
      </form>
    </div>
  );
}
