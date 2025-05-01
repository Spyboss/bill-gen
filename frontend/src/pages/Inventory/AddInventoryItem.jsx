import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Spin, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { addToInventory } from '../../services/inventoryService';
import { getAllBikeModels } from '../../services/bikeModelService';

const { Option } = Select;

const AddInventoryItem = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bikeModels, setBikeModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    fetchBikeModels();
  }, []);

  const fetchBikeModels = async () => {
    try {
      setLoading(true);
      const response = await getAllBikeModels();
      setBikeModels(response);
    } catch (error) {
      message.error('Failed to fetch bike models');
      console.error('Error fetching bike models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelId) => {
    const model = bikeModels.find(m => m._id === modelId);
    setSelectedModel(model);
    
    if (model) {
      // Pre-fill motor and chassis number prefixes
      form.setFieldsValue({
        motorNumber: model.motor_number_prefix ? `${model.motor_number_prefix}-` : '',
        chassisNumber: model.chassis_number_prefix ? `${model.chassis_number_prefix}-` : ''
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      const inventoryData = {
        ...values,
        dateAdded: values.dateAdded ? values.dateAdded.toISOString() : new Date().toISOString()
      };
      
      await addToInventory(inventoryData);
      
      message.success('Bike added to inventory successfully');
      navigate('/inventory');
    } catch (error) {
      message.error('Failed to add bike to inventory');
      console.error('Error adding bike to inventory:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Add Bike to Inventory</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'available',
            dateAdded: null
          }}
        >
          <Form.Item
            name="bikeModelId"
            label="Bike Model"
            rules={[{ required: true, message: 'Please select a bike model' }]}
          >
            <Select
              placeholder="Select bike model"
              onChange={handleModelChange}
              loading={loading}
            >
              {bikeModels.map(model => (
                <Option key={model._id} value={model._id}>
                  {model.name} - Rs. {model.price?.toLocaleString() || 'N/A'} 
                  {model.is_tricycle ? ' (E-TRICYCLE)' : model.is_ebicycle ? ' (E-MOTORBICYCLE)' : ' (E-MOTORCYCLE)'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="motorNumber"
            label="Motor Number"
            rules={[{ required: true, message: 'Please enter motor number' }]}
          >
            <Input placeholder="Enter motor number" />
          </Form.Item>

          <Form.Item
            name="chassisNumber"
            label="Chassis Number"
            rules={[{ required: true, message: 'Please enter chassis number' }]}
          >
            <Input placeholder="Enter chassis number" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="available">Available</Option>
              <Option value="reserved">Reserved</Option>
              <Option value="damaged">Damaged</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateAdded"
            label="Date Added"
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={4} placeholder="Enter any additional notes" />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end space-x-4">
              <Button onClick={() => navigate('/inventory')}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Add to Inventory
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddInventoryItem;
