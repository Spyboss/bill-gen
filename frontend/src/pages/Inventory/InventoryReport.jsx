import React, { useState, useEffect } from 'react';
import { Card, Spin, Statistic, Table, Tag, Button, Row, Col, Divider } from 'antd';
import { DownloadOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getInventorySummary } from '../../services/inventoryService';
import { format } from 'date-fns';

const statusColors = {
  available: 'green',
  sold: 'blue',
  reserved: 'orange',
  damaged: 'red'
};

const InventoryReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [statusTotals, setStatusTotals] = useState([]);
  const [inventoryValue, setInventoryValue] = useState({ totalValue: 0, count: 0 });
  const [reportDate] = useState(new Date());

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await getInventorySummary();
      
      setSummary(response.summary);
      setStatusTotals(response.statusTotals);
      setInventoryValue(response.inventoryValue);
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Model Name', 'Price', 'Available', 'Sold', 'Reserved', 'Damaged', 'Total'];
    
    const rows = summary.map(item => {
      const available = item.statusCounts.find(s => s.status === 'available')?.count || 0;
      const sold = item.statusCounts.find(s => s.status === 'sold')?.count || 0;
      const reserved = item.statusCounts.find(s => s.status === 'reserved')?.count || 0;
      const damaged = item.statusCounts.find(s => s.status === 'damaged')?.count || 0;
      
      return [
        item.modelName,
        item.price,
        available,
        sold,
        reserved,
        damaged,
        item.totalCount
      ];
    });
    
    // Add totals row
    const totalAvailable = statusTotals.find(s => s.status === 'available')?.count || 0;
    const totalSold = statusTotals.find(s => s.status === 'sold')?.count || 0;
    const totalReserved = statusTotals.find(s => s.status === 'reserved')?.count || 0;
    const totalDamaged = statusTotals.find(s => s.status === 'damaged')?.count || 0;
    const grandTotal = totalAvailable + totalSold + totalReserved + totalDamaged;
    
    rows.push([
      'TOTAL',
      inventoryValue.totalValue,
      totalAvailable,
      totalSold,
      totalReserved,
      totalDamaged,
      grandTotal
    ]);
    
    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${format(reportDate, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Model',
      dataIndex: 'modelName',
      key: 'modelName',
      render: (text, record) => (
        <span>
          {text}
          {record.isEbicycle && <Tag color="cyan" className="ml-2">E-Bicycle</Tag>}
          {record.isTricycle && <Tag color="purple" className="ml-2">Tricycle</Tag>}
        </span>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `Rs. ${price?.toLocaleString() || 0}`
    },
    {
      title: 'Available',
      key: 'available',
      render: (_, record) => {
        const count = record.statusCounts.find(s => s.status === 'available')?.count || 0;
        return <Tag color={count > 0 ? 'green' : 'default'}>{count}</Tag>;
      }
    },
    {
      title: 'Sold',
      key: 'sold',
      render: (_, record) => {
        const count = record.statusCounts.find(s => s.status === 'sold')?.count || 0;
        return <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>;
      }
    },
    {
      title: 'Reserved',
      key: 'reserved',
      render: (_, record) => {
        const count = record.statusCounts.find(s => s.status === 'reserved')?.count || 0;
        return <Tag color={count > 0 ? 'orange' : 'default'}>{count}</Tag>;
      }
    },
    {
      title: 'Damaged',
      key: 'damaged',
      render: (_, record) => {
        const count = record.statusCounts.find(s => s.status === 'damaged')?.count || 0;
        return <Tag color={count > 0 ? 'red' : 'default'}>{count}</Tag>;
      }
    },
    {
      title: 'Total',
      dataIndex: 'totalCount',
      key: 'totalCount'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-semibold">Inventory Report</h1>
        <div className="space-x-2">
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchSummary}
          >
            Refresh
          </Button>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button 
            type="primary"
            icon={<DownloadOutlined />} 
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="print:block print:mt-8">
        <div className="text-center mb-6 hidden print:block">
          <h1 className="text-2xl font-bold">Gunawardhana Motors</h1>
          <h2 className="text-xl">Inventory Report</h2>
          <p className="text-gray-500">Generated on: {format(reportDate, 'dd/MM/yyyy HH:mm')}</p>
        </div>

        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Bikes in Inventory"
                value={statusTotals.reduce((sum, item) => sum + item.count, 0)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Available Bikes"
                value={statusTotals.find(s => s.status === 'available')?.count || 0}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Sold Bikes"
                value={statusTotals.find(s => s.status === 'sold')?.count || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Inventory Value"
                value={inventoryValue.totalValue}
                prefix="Rs. "
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Inventory by Model" className="mb-6">
          <Table
            columns={columns}
            dataSource={summary}
            rowKey="modelId"
            pagination={false}
            summary={() => {
              const totalAvailable = statusTotals.find(s => s.status === 'available')?.count || 0;
              const totalSold = statusTotals.find(s => s.status === 'sold')?.count || 0;
              const totalReserved = statusTotals.find(s => s.status === 'reserved')?.count || 0;
              const totalDamaged = statusTotals.find(s => s.status === 'damaged')?.count || 0;
              const grandTotal = totalAvailable + totalSold + totalReserved + totalDamaged;
              
              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>TOTAL</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Tag color="green">{totalAvailable}</Tag>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Tag color="blue">{totalSold}</Tag>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Tag color="orange">{totalReserved}</Tag>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>
                      <Tag color="red">{totalDamaged}</Tag>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6}>
                      <strong>{grandTotal}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </Card>

        <div className="print:mt-8 print:text-sm print:text-gray-500">
          <Divider />
          <p className="text-center">
            Report generated on {format(reportDate, 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
