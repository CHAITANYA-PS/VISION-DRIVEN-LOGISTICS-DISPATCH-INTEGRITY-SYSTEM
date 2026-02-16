import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function VerificationResult({ result, onProceed, onRequestApproval, shipmentType }) {
  if (!result) return null;

  const isMatch = result.matched;
  const details = result.details;

  return (
    <div className={`border rounded-lg p-6 ${isMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center gap-3 mb-4">
        {isMatch ? (
          <CheckCircle className="text-green-600" size={32} />
        ) : (
          <XCircle className="text-red-600" size={32} />
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isMatch ? 'Verification Successful' : 'Verification Mismatch'}
          </h3>
          <p className="text-sm text-gray-600">{result.message}</p>
        </div>
      </div>

      {details && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Comparison Details</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-gray-700">Field</th>
                    <th className="text-left py-2 px-3 text-gray-700">Expected</th>
                    <th className="text-left py-2 px-3 text-gray-700">Extracted</th>
                    <th className="text-center py-2 px-3 text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    field="Product Code"
                    expected={details.expectedProductCode}
                    extracted={details.extractedProductCode}
                  />
                  <ComparisonRow
                    field="SKU"
                    expected={details.expectedSku}
                    extracted={details.extractedSku}
                  />
                  <ComparisonRow
                    field="Weight"
                    expected={details.expectedWeight}
                    extracted={details.extractedWeight}
                  />
                  <ComparisonRow
                    field="Color"
                    expected={details.expectedColor}
                    extracted={details.extractedColor}
                  />
                  <ComparisonRow
                    field="Dimensions"
                    expected={details.expectedDimensions}
                    extracted={details.extractedDimensions}
                  />
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Confidence Score:</span>{' '}
              <span className={details.confidence > 0.8 ? 'text-green-600' : 'text-yellow-600'}>
                {(details.confidence * 100).toFixed(1)}%
              </span>
            </div>
            {details.binLocation && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Bin Location:</span>{' '}
                <span className="text-blue-600">{details.binLocation}</span>
              </div>
            )}
          </div>

          {details.issues && details.issues.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Issues Detected:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {details.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {isMatch && result.autoAssigned ? (
          <>
            {shipmentType === 'OUTBOUND' ? (
              <div className="flex-1">
                <Badge variant="green" className="text-sm">
                  Verification successful! Redirecting to picking page...
                </Badge>
              </div>
            ) : (
              <Button variant="primary" onClick={onProceed} className="flex-1">
                <CheckCircle size={20} className="mr-2" />
                Continue to Next Package
              </Button>
            )}
          </>
        ) : !isMatch && result.approvalRequestId ? (
          <div className="flex-1">
            <Badge variant="yellow" className="text-sm">
              Approval Request Submitted (ID: {result.approvalRequestId})
            </Badge>
          </div>
        ) : (
          <Button variant="primary" onClick={onRequestApproval} className="flex-1">
            Request Supervisor Approval
          </Button>
        )}
      </div>
    </div>
  );
}

function ComparisonRow({ field, expected, extracted }) {
  const matches = expected === extracted || (!expected && !extracted);
  
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 px-3 font-medium text-gray-700">{field}</td>
      <td className="py-2 px-3 text-gray-600">{expected || '-'}</td>
      <td className="py-2 px-3 text-gray-600">{extracted || '-'}</td>
      <td className="py-2 px-3 text-center">
        {matches ? (
          <CheckCircle className="text-green-600 inline" size={16} />
        ) : (
          <XCircle className="text-red-600 inline" size={16} />
        )}
      </td>
    </tr>
  );
}






