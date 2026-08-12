import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';

function LocationPicker({ location, onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return location ? (
    <Marker position={[location.lat, location.lng]}>
      <Popup>Selected planting site</Popup>
    </Marker>
  ) : null;
}

export default function SubmissionMap({ location, onLocationSelect }) {
  return (
    <div className="submission-map">
      <MapContainer
        center={location ? [location.lat, location.lng] : [0, 0]}
        zoom={location ? 12 : 3}
        scrollWheelZoom
        style={{ height: '320px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationPicker location={location} onSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}
