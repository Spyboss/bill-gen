import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../config/apiClient'
import { Table, Tag, Button, Space, Popconfirm, message, Spin, Input, Badge } from 'antd'
import { PlusOutlined, SearchOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined, FileExcelOutlined } from '@ant-design/icons'

const BillList = () => {
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/bills')

      // Handle the new response format which includes pagination
      let billsData = [];

      // Check for the actual response format we're getting
      if (response && response.bills && Array.isArray(response.bills)) {
        console.log('Using bills directly from response')
        billsData = response.bills;
      } else if (response.data && response.data.bills) {
        // New format with pagination in data property
        console.log('Using bills from response.data')
        billsData = response.data.bills;
      } else if (response.data && Array.isArray(response.data)) {
        // Old format (direct array)
        console.log('Using response.data as array')
        billsData = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response
        console.log('Using response directly as array')
        billsData = response;
      } else {
        console.error('Invalid response format from API:', response)
        toast.error('Failed to fetch bills: Invalid response format')
        setBills([])
        return
      }

      // Transform the data for compatibility
      const transformedBills = billsData.map(bill => ({
        ...bill,
        id: bill._id || bill.id,
        key: bill._id || bill.id || Math.random().toString()
      }))

      setBills(transformedBills)
    } catch (error) {
      console.error('Error fetching bills:', error)
      toast.error(`Failed to fetch bills: ${error.message || 'Server error'}`)
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewPDF = async (billId) => {
    try {
      const response = await apiClient.get(`/bills/${billId}/pdf?preview=true`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF: ' + (error.response?.data?.error || error.message || 'Server error'));
    }
  }

  const handleDownloadPDF = async (billId) => {
    try {
      const response = await apiClient.get(`/bills/${billId}/pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bill-${billId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF: ' + (error.response?.data?.error || error.message || 'Server error'));
    }
  }

  const handleDelete = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) {
      return
    }

    try {
      setLoading(true)
      await apiClient.delete(`/bills/${billId}`)
      toast.success('Bill deleted successfully')
      fetchBills()
    } catch (error) {
      console.error('Error deleting bill:', error)
      toast.error(`Failed to delete bill: ${error.message || 'Server error'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'processing',
      completed: 'success',
      cancelled: 'error',
      converted: 'warning'
    };
    return statusMap[status?.toLowerCase()] || 'default';
  }

  const handleStatusChange = async (billId, newStatus) => {
    try {
      await apiClient.patch(`/bills/${billId}`, { status: newStatus })
      toast.success(`Bill marked as ${newStatus}`);
      fetchBills();
    } catch (error) {
      console.error('Error updating bill status:', error);
      toast.error('Failed to update bill status');
    }
  }

  const handleExportToExcel = async () => {
    try {
      const blob = await apiClient.get('/bills/export', {
        responseType: 'blob'
      })

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Bills-Export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Bills exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting bills:', error);
      toast.error('Failed to export bills');
    }
  };

  const getBillTypeBadge = (type) => {
    if (!type) return <Tag color="default">Unknown</Tag>;

    const typeMap = {
      cash: { color: 'green', text: 'Cash' },
      leasing: { color: 'blue', text: 'Leasing' },
      advance: { color: 'orange', text: 'Advance Payment' },
      advancement: { color: 'orange', text: 'Advance Payment' }
    };

    const typeInfo = typeMap[type.toLowerCase()] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return 'Rs. 0';
    const numericAmount = parseFloat(amount);
    return isNaN(numericAmount) ? 'Rs. 0' : `Rs. ${numericAmount.toLocaleString()}`;
  };

  const filterBills = (bill) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    return (
      (bill.customerName && bill.customerName.toLowerCase().includes(searchLower)) ||
      (bill.customer_name && bill.customer_name.toLowerCase().includes(searchLower)) ||
      (bill.customerNIC && bill.customerNIC.toLowerCase().includes(searchLower)) ||
      (bill.customer_nic && bill.customer_nic.toLowerCase().includes(searchLower)) ||
      (bill.bikeModel && bill.bikeModel.toLowerCase().includes(searchLower)) ||
      (bill.bike_model && bill.bike_model.toLowerCase().includes(searchLower)) ||
      (bill.billNumber && bill.billNumber.toLowerCase().includes(searchLower)) ||
      (bill.bill_number && bill.bill_number.toLowerCase().includes(searchLower)) ||
      (bill._id && bill._id.toLowerCase().includes(searchLower))
    );
  };

  const getBillTypeTag = (record) => {
    if (record.isAdvancePayment) {
      return <Tag color="orange">{`Advance ${record.billType}`}</Tag>;
    }
    return <Tag color={record.billType?.toLowerCase() === 'cash' ? 'green' : 'blue'}>
      {record.billType?.toUpperCase() || 'CASH'}
    </Tag>;
  };

  const columns = [
    {
      title: 'Bill #',
      dataIndex: 'billNumber',
      key: 'billNumber',
      render: (billNumber, record) => (
        <Link to={`/bills/${record._id}`} className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
          {billNumber || record.bill_number || record._id.substring(0, 8)}
        </Link>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Model',
      dataIndex: 'bikeModel',
      key: 'bikeModel',
    },
    {
      title: 'Type',
      dataIndex: 'billType',
      key: 'billType',
      render: (type) => getBillTypeBadge(type),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => formatAmount(amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge status={getStatusBadgeClass(status)} text={status} />
      ),
    },
    {
      title: 'Inventory',
      key: 'inventory',
      render: (_, record) => (
        record.inventoryItemId ? (
          <Tag color="green">From Inventory</Tag>
        ) : (
          <Tag color="orange">Manual Entry</Tag>
        )
      ),
    },
    {
      title: 'Date',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              handlePreviewPDF(record._id);
            }}
            title="Preview"
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              handleDownloadPDF(record._id);
            }}
            title="Download"
          />
          <Popconfirm
            title="Are you sure you want to delete this bill?"
            onConfirm={(e) => {
              e.stopPropagation(); // Prevent row click
              handleDelete(record._id);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Delete"
              onClick={(e) => e.stopPropagation()} // Prevent row click
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 dark:bg-slate-900 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Bills</h1>
        <div className="flex space-x-3">
          <Input
            placeholder="Search bills..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            className="w-64"
          />
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/bills/new')}
            >
              Standard Bill
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => navigate('/bills/new-with-inventory')}
            >
              Bill with Inventory
            </Button>
          </Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportToExcel}
          >
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          rowKey="_id"
          dataSource={bills.filter(filterBills)}
          columns={columns}
          pagination={{ pageSize: 10 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border dark:border-gray-700"
          onRow={(record) => ({
            onClick: () => navigate(`/bills/${record._id}`),
            style: { cursor: 'pointer' }
          })}
        />
      )}
    </div>
  )
}

export default BillList
