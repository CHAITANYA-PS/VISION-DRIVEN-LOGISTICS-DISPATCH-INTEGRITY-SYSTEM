import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Scan, CheckCircle, AlertTriangle, Upload, Camera, MapPin, Truck } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { Progress } from '../../components/common/Progress';
import VerificationResult from '../../components/inbound/VerificationResult';
import { getAssignedShipments } from '../../services/shipmentService';
import { getShipmentItemsWithLocations, verifyPackage } from '../../services/inboundVerificationService';

export default function Outbound() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchOutboundShipments();
  }, []);

  const fetchOutboundShipments = async () => {
    try {
      const data = await getAssignedShipments();
      const outbound = data.filter(s => s.shipmentType === 'OUTBOUND' && s.status !== 'COMPLETED');
      setShipments(outbound);
    } catch (err) {
      setError('Failed to load outbound shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentSelect = async (shipment) => {
    try {
      setLoading(true);
      setError('');
      const items = await getShipmentItemsWithLocations(shipment.id);
      setPackages(items);
      setSelectedShipment(shipment);
      setSelectedPackage(null);
      setVerificationResult(null);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError('Failed to load shipment packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setVerificationResult(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!imageFile || !selectedPackage) {
      setError('Please select a package and upload an image');
      return;
    }

    try {
      setVerifying(true);
      setError('');
      const result = await verifyPackage(selectedPackage.id, imageFile);
      setVerificationResult(result);
      
      // Reload packages to update status after verification
      const items = await getShipmentItemsWithLocations(selectedShipment.id);
      setPackages(items);
      
      // Refetch shipments to update verifiedCount in the list
      await fetchOutboundShipments();
      
      // Navigate to picking page if verification is successful
      if (result.matched && result.autoAssigned) {
        // Small delay to show success message before navigation
        setTimeout(() => {
          navigate('/worker/picking');
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleProceed = () => {
    // Move to next package
    setSelectedPackage(null);
    setVerificationResult(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const getVerifiedCount = () => {
    return packages.filter(p => p.status === 'RECEIVED' || p.status === 'DISPATCHED').length;
  };

  const areAllPackagesVerified = (shipment) => {
    const verifiedCount = shipment.verifiedCount || 0;
    const packageCount = shipment.packageCount || 0;
    return packageCount > 0 && verifiedCount >= packageCount;
  };

  if (loading) return <Loading text="Loading outbound shipments..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outbound Shipment Verification</h1>
        <p className="text-gray-600 mt-1">Verify packages before shipping with AI-powered inspection</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!selectedShipment ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Shipments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shipments.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No outbound shipments available</p>
                  </div>
                </Card>
              </div>
            ) : (
              shipments.map((shipment) => (
                <Card key={shipment.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>SH-{shipment.id}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Badge variant="purple">OUTBOUND</Badge>
                      <Badge variant="yellow">{shipment.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Created: {new Date(shipment.createdAt).toLocaleDateString()}</p>
                      <p className="font-medium mt-1">Packages: {shipment.packageCount || 0}</p>
                    </div>
                    <div className="pt-2">
                      {shipment.packageCount > 0 ? (
                        <>
                          <Progress 
                            value={shipment.verifiedCount || 0} 
                            max={shipment.packageCount || 1} 
                            className="mb-2" 
                          />
                          <p className="text-xs text-gray-500">
                            {shipment.verifiedCount || 0} / {shipment.packageCount} packages verified
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">No packages</p>
                      )}
                    </div>
                    {areAllPackagesVerified(shipment) ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <CheckCircle size={20} className="mr-2" />
                        All Packages Verified
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => handleShipmentSelect(shipment)}
                      >
                        <Scan size={20} className="mr-2" />
                        Start Processing
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Processing: Shipment SH-{selectedShipment.id}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Progress: {getVerifiedCount()} / {packages.length} packages verified
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Refetch shipments before going back to list
                    await fetchOutboundShipments();
                    setSelectedShipment(null);
                    setSelectedPackage(null);
                    setVerificationResult(null);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={getVerifiedCount()} max={packages.length || 1} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Package List */}
            <Card>
              <CardHeader>
                <CardTitle>Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {packages.map((pkg, index) => (
                    <div
                      key={pkg.id}
                      onClick={() => pkg.status !== 'RECEIVED' && pkg.status !== 'DISPATCHED' && handlePackageSelect(pkg)}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-blue-500 bg-blue-50 cursor-pointer'
                          : pkg.status === 'RECEIVED' || pkg.status === 'DISPATCHED'
                          ? pkg.status === 'DISPATCHED'
                            ? 'border-purple-200 bg-purple-50 cursor-not-allowed'
                            : 'border-green-200 bg-green-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">Package #{index + 1}</span>
                            {pkg.status === 'RECEIVED' && (
                              <CheckCircle className="text-green-600" size={16} />
                            )}
                            {pkg.status === 'DISPATCHED' && (
                              <Truck className="text-purple-600" size={16} />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">SKU: {pkg.skuCode}</p>
                          <p className="text-sm text-gray-600">Product: {pkg.productName}</p>
                          <p className="text-sm text-gray-600">Quantity: {pkg.quantity}</p>
                          {pkg.zoneName && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                              <MapPin size={12} />
                              <span>{pkg.zoneName} / {pkg.rackName} / {pkg.binName}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={
                            pkg.status === 'DISPATCHED' ? 'purple' :
                            pkg.status === 'RECEIVED' ? 'green' : 'gray'
                          }>
                            {pkg.status || 'PENDING'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scan & Verify */}
            <div className="space-y-6">
              {selectedPackage ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Scan & Verify Package</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Expected Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Product Code:</span>
                            <p className="font-medium">{selectedPackage.productCode}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">SKU:</span>
                            <p className="font-medium">{selectedPackage.skuCode}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Package Image
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {imagePreview ? (
                            <div className="space-y-3">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-h-48 mx-auto rounded"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Change Image
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-600 mb-1">Click to upload or drag image here</p>
                              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleVerify}
                        disabled={!imageFile || verifying}
                      >
                        {verifying ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            Verifying with AI...
                          </>
                        ) : (
                          <>
                            <Scan size={20} className="mr-2" />
                            Verify with AI
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {verificationResult && (
                    <VerificationResult
                      result={verificationResult}
                      onProceed={handleProceed}
                      onRequestApproval={() => {
                        // Approval already submitted by backend
                        handleProceed();
                      }}
                      shipmentType="OUTBOUND"
                    />
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Select a package to start verification</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






