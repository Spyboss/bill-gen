import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import bikeModelService from '../../services/bikeModelService'; // Assuming this path is correct

const BikeModelList = () => {
  const [bikeModels, setBikeModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBikeModels = async () => {
      try {
        setLoading(true);
        const response = await bikeModelService.getAllBikeModels();
        setBikeModels(response || []); // Use the response directly
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch bike models');
        toast.error(err.message || 'Failed to fetch bike models');
      } finally {
        setLoading(false);
      }
    };

    fetchBikeModels();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bike model?')) {
      try {
        await bikeModelService.deleteBikeModel(id);
        setBikeModels(bikeModels.filter(model => model._id !== id));
        toast.success('Bike model deleted successfully');
      } catch (err) {
        toast.error(err.message || 'Failed to delete bike model');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-10 dark:text-gray-300">Loading bike models...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Bike Models Management</h1>
        <Link
          to="/admin/bike-models/new"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Add New Bike Model
        </Link>
      </div>

      {bikeModels.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No bike models found. Add one to get started!</p>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-Bike</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tricycle</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Leasable</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {bikeModels.map((model) => (
                <tr key={model._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{model.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">Rs. {model.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{model.is_ebicycle ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{model.is_tricycle ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{model.can_be_leased ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/bike-models/edit/${model._id}`}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(model._id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BikeModelList;
