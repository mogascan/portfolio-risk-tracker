import { useState, useEffect } from 'react';
import { getPortfolio, addAsset, removeAsset, updateAsset } from '../api/portfolio';

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const data = await getPortfolio();
      setPortfolio(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addAssetToPortfolio = async (asset) => {
    try {
      const updatedPortfolio = await addAsset(asset);
      setPortfolio(updatedPortfolio);
      return updatedPortfolio;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeAssetFromPortfolio = async (assetId) => {
    try {
      const updatedPortfolio = await removeAsset(assetId);
      setPortfolio(updatedPortfolio);
      return updatedPortfolio;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateAssetInPortfolio = async (assetId, updates) => {
    try {
      const updatedPortfolio = await updateAsset(assetId, updates);
      setPortfolio(updatedPortfolio);
      return updatedPortfolio;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    portfolio,
    loading,
    error,
    addAsset: addAssetToPortfolio,
    removeAsset: removeAssetFromPortfolio,
    updateAsset: updateAssetInPortfolio,
    refreshPortfolio: fetchPortfolio
  };
};
