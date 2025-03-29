import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, DatePicker, InputNumber, Switch, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/apiClient';
import toast from 'react-hot-toast';

const { Option } = Select;

const BillGenerator = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [bikeModels, setBikeModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [billType, setBillType] = useState('cash');
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [bikePrice, setBikePrice] = useState(0);

  useEffect(() => {
    fetchBikeModels();
  }, []);

  const fetchBikeModels = async () => {
    try {
      const data = await apiClient.get('/bike-models');
      console.log('Fetched bike models:', data);
      setBikeModels(data);
    } catch (error) {
      console.error('Error fetching bike models:', error);
      message.error('Failed to fetch bike models');
    }
  };

  const handleModelChange = async (modelId) => {
    if (!modelId) return;
    
    // Find the selected model from the models list
    const model = bikeModels.find(model => model._id === modelId);
    
    if (model) {
      setSelectedModel(model);
      
      // Update the form with the model price
      form.setFieldsValue({
        bike_price: model.price,
      });
      
      // If it's an e-bicycle or a tricycle, enforce cash bill type
      if (model.is_ebicycle || model.is_tricycle) {
        setBillType('cash');
        // Set price field
        setBikePrice(model.price);
      } else {
        // Regular e-bike
        setBikePrice(model.price);
      }
    }
  };

  const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BILL-${year}${month}${day}-${random}`;
  };

  const calculateTotalAmount = (values) => {
    const model = bikeModels.find(m => m._id === values.model_id);
    if (!model) return 0;

    const bikePrice = parseFloat(model.price);
    
    // For e-bicycles and tricycles, the price is already the final price
    if (model.is_ebicycle || model.is_tricycle) {
      return bikePrice;
    }

    // For leasing, total amount is just the down payment
    if (billType === 'leasing') {
      return values.down_payment || 0;
    }

    // For regular bikes with cash payment, add RMV charge
    return bikePrice + 13000;
  };

  const handlePreviewBill = async () => {
    try {
      setPreviewLoading(true);
      const values = await form.validateFields();
      
      // Prepare bill data for preview
      const billData = {
        ...values,
        bill_type: billType.toUpperCase(),
        is_ebicycle: selectedModel?.is_ebicycle || false,
        is_tricycle: selectedModel?.is_tricycle || false,
        can_be_leased: selectedModel?.can_be_leased || true
      };
      
      const bikePrice = values.bike_price || 0;
      
      // Calculate total amount based on bill type and model
      if (billType === 'cash') {
        if (selectedModel?.is_ebicycle || selectedModel?.is_tricycle) {
          // E-Bicycles and Tricycles: no RMV
          billData.total_amount = parseFloat(bikePrice);
          billData.rmv_charge = 0;
        } else {
          // Regular E-Motorcycles: add RMV
          billData.total_amount = parseFloat(bikePrice) + 13000;
          billData.rmv_charge = 13000;
        }
      } else {
        // Leasing (only for regular E-Motorcycles)
        billData.total_amount = parseFloat(values.down_payment || 0);
        billData.rmv_charge = 13500;
        billData.is_cpz = true;
      }

      // Handle advance payment
      if (isAdvancePayment) {
        billData.advance_amount = parseFloat(values.advance_amount || 0);
        billData.balance_amount = billData.total_amount - billData.advance_amount;
      }
      
      // Set vehicle type
      if (selectedModel?.is_tricycle) {
        billData.vehicle_type = 'E-TRICYCLE';
      } else if (selectedModel?.is_ebicycle) {
        billData.vehicle_type = 'E-MOTORBICYCLE';
      } else {
        billData.vehicle_type = 'E-MOTORCYCLE';
      }
      
      // Get the preview PDF
      const blob = await apiClient.get(
        `/bills/preview/pdf?formData=${encodeURIComponent(JSON.stringify(billData))}`
      );
      
      // Create a blob URL for the preview
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setPreviewVisible(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      message.error('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Check if a model was selected
      if (!selectedModel) {
        toast.error('Please select a bike model');
        return;
      }
      
      // Create the bill data
      const billData = {
        // Customer details
        customerName: values.customer_name,
        customerNIC: values.customer_nic,
        customerAddress: values.customer_address,
        
        // Bike details
        bikeModel: selectedModel.name,
        bikePrice: selectedModel.price,
        motorNumber: values.motor_number,
        chassisNumber: values.chassis_number,
        
        // Vehicle type flags
        isEbicycle: selectedModel.is_ebicycle || false,
        isTricycle: selectedModel.is_tricycle || false,
        
        // Bill type
        billType: billType,
        
        // Dates
        billDate: values.bill_date ? values.bill_date.toISOString() : new Date().toISOString(),
        
        // Advance payment
        isAdvancePayment: isAdvancePayment,
      };
      
      // Set vehicle type
      if (selectedModel.is_tricycle) {
        billData.vehicleType = 'E-TRICYCLE';
        // No RMV charges for tricycles
        billData.rmvCharge = 0;
        // Only cash sales for tricycles
        billData.billType = 'cash';
      } else if (selectedModel.is_ebicycle) {
        billData.vehicleType = 'E-MOTORBICYCLE';
        // No RMV charges for e-bicycles
        billData.rmvCharge = 0;
        // Only cash sales for e-bicycles
        billData.billType = 'cash';
      } else {
        billData.vehicleType = 'E-MOTORCYCLE';
        // RMV charges depend on bill type
        billData.rmvCharge = billType === 'leasing' ? 13500 : 13000;
      }
      
      // Handle bill type specific fields
      if (billType === 'leasing' && !selectedModel.is_ebicycle && !selectedModel.is_tricycle) {
        // For leasing, add down payment
        const downPayment = parseFloat(values.down_payment || 0);
        billData.downPayment = downPayment;
        
        // Total amount for leasing is down payment only
        billData.totalAmount = downPayment;
        
        // Handle advance payment for leasing
        if (isAdvancePayment) {
          const advanceAmount = parseFloat(values.advance_amount || 0);
          billData.advanceAmount = advanceAmount;
          billData.balanceAmount = downPayment - advanceAmount;
          
          if (values.estimated_delivery_date) {
            billData.estimatedDeliveryDate = values.estimated_delivery_date.toISOString();
          }
        }
      } else {
        // For cash bill
        // Total amount depends on vehicle type
        if (selectedModel.is_ebicycle || selectedModel.is_tricycle) {
          billData.totalAmount = selectedModel.price;  // No RMV charges
        } else {
          billData.totalAmount = selectedModel.price + 13000;  // Regular bikes: price + RMV
        }
        
        // Handle advance payment for cash
        if (isAdvancePayment) {
          const advanceAmount = parseFloat(values.advance_amount || 0);
          billData.advanceAmount = advanceAmount;
          billData.balanceAmount = billData.totalAmount - advanceAmount;
          
          if (values.estimated_delivery_date) {
            billData.estimatedDeliveryDate = values.estimated_delivery_date.toISOString();
          }
        }
      }
      
      console.log('Submitting bill data:', billData);
      
      const response = await apiClient.post('/bills', billData);
      
      toast.success('Bill generated successfully');
      navigate(`/bills/${response._id || response.id}`);
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error('Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Generate New Bill</h1>

      {selectedModel?.is_ebicycle && (
        <div className="bg-blue-50 p-4 mb-6 rounded border border-blue-200">
          <h3 className="text-blue-800 font-medium">E-Bicycle Selected</h3>
          <p className="text-blue-600 text-sm mt-1">This is an e-bicycle model. Only cash sales are allowed, and no RMV charges apply.</p>
        </div>
      )}

      {selectedModel?.is_tricycle && (
        <div className="bg-green-50 p-4 mb-6 rounded border border-green-200">
          <h3 className="text-green-800 font-medium">E-Tricycle Selected</h3>
          <p className="text-green-600 text-sm mt-1">This is an e-tricycle model. Only cash sales are allowed, and no RMV charges apply.</p>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          bill_type: 'cash',
          is_advance_payment: false,
          bill_date: null,
          estimated_delivery_date: null
        }}
      >
        <Form.Item
          name="model_id"
          label="Vehicle Model"
          rules={[{ required: true, message: 'Please select a vehicle model' }]}
        >
          <Select
            onChange={handleModelChange}
            placeholder="Select vehicle model"
            options={bikeModels.map(model => ({
              label: `${model.name} - Rs. ${model.price?.toLocaleString() || 'N/A'} ${model.is_tricycle ? '(E-TRICYCLE)' : model.is_ebicycle ? '(E-MOTORBICYCLE)' : '(E-MOTORCYCLE)'}`,
              value: model._id
            }))}
            notFoundContent={bikeModels.length === 0 ? 'No vehicle models available' : 'No matching models found'}
          />
        </Form.Item>

        <Form.Item
          name="bill_type"
          label="Bill Type"
        >
          <Select
            value={billType}
            onChange={(value) => setBillType(value)}
            disabled={selectedModel?.is_ebicycle || selectedModel?.is_tricycle}
            options={[
              { label: 'Cash', value: 'cash' },
              { label: 'Leasing', value: 'leasing', disabled: selectedModel?.is_ebicycle || selectedModel?.is_tricycle }
            ]}
          />
        </Form.Item>

        {billType === 'leasing' && (
          <Form.Item
            name="down_payment"
            label="Down Payment"
            rules={[{ required: billType === 'leasing', message: 'Please enter down payment amount' }]}
          >
            <InputNumber
              min={0}
              addonBefore="Rs."
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\₹\s?|(,*)/g, '')}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Advance Payment"
          name="is_advance_payment"
          valuePropName="checked"
        >
          <Switch onChange={(checked) => setIsAdvancePayment(checked)} />
        </Form.Item>

        {isAdvancePayment && (
          <Form.Item
            name="advance_amount"
            label="Advance Amount"
            rules={[{ required: isAdvancePayment, message: 'Please enter advance amount' }]}
          >
            <InputNumber
              min={0}
              addonBefore="Rs."
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\₹\s?|(,*)/g, '')}
            />
          </Form.Item>
        )}

        <Form.Item
          name="customer_name"
          label="Customer Name"
          rules={[{ required: true, message: 'Please enter customer name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="customer_nic"
          label="Customer NIC"
          rules={[{ required: true, message: 'Please enter customer NIC' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="customer_address"
          label="Customer Address"
          rules={[{ required: true, message: 'Please enter customer address' }]}
        >
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          name="motor_number"
          label="Motor Number"
          rules={[{ required: true, message: 'Please enter motor number' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="chassis_number"
          label="Chassis Number"
          rules={[{ required: true, message: 'Please enter chassis number' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="bill_date"
          label="Bill Date"
        >
          <DatePicker className="w-full" />
        </Form.Item>

        {isAdvancePayment && (
          <Form.Item
            name="estimated_delivery_date"
            label="Estimated Delivery Date"
          >
            <DatePicker className="w-full" />
          </Form.Item>
        )}

        <Form.Item className="flex justify-between">
          <Button type="default" onClick={handlePreviewBill} loading={previewLoading}>
            Preview Bill
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Generate Bill
          </Button>
        </Form.Item>
      </Form>

      {/* Preview Modal */}
      <Modal
        title="Bill Preview"
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          URL.revokeObjectURL(previewUrl);
        }}
        width={800}
        footer={[
          <Button key="back" onClick={() => {
            setPreviewVisible(false);
            URL.revokeObjectURL(previewUrl);
          }}>
            Close
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            Generate Bill
          </Button>,
        ]}
      >
        <div className="h-[700px]">
          <iframe 
            src={previewUrl} 
            title="Bill Preview" 
            className="w-full h-full border-0"
          />
        </div>
      </Modal>
    </div>
  );
};

export default BillGenerator; 