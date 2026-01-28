import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, X, Search, Filter, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"; // Assuming a multi-select component is available

interface Condition {
  customizationId: string;
}

interface Customization {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  category: string | null;
  conditions: Condition[] | null;
}

interface Product {
  id: string;
  name: string;
}

interface CustomizationFormData {
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  product_id: string;
  category: string;
  conditionIds: string[]; // Store only the IDs of the conditional customizations
}

export function CustomizationsManagement() {
  const supabase = createClient();

  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const [formData, setFormData] = useState<CustomizationFormData>({
    name: "",
    description: "",
    price: "0",
    is_available: true,
    product_id: "",
    category: "",
    conditionIds: [],
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomizations();
  }, []);

  const fetchProducts = async () => {
    // ... (fetch products logic - unchanged)
  };

  const fetchCustomizations = async () => {
    // ... (fetch customizations logic - updated to include category and conditions)
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "0",
      is_available: true,
      product_id: "",
      category: "",
      conditionIds: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (customization: Customization) => {
    setFormData({
      name: customization.name,
      description: customization.description || "",
      price: customization.price.toString(),
      is_available: customization.is_available,
      product_id: customization.product_id,
      category: customization.category || "",
      conditionIds: customization.conditions?.map(c => c.customizationId) || [],
    });
    setEditingId(customization.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.product_id) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
        product_id: formData.product_id,
        category: formData.category || null,
        conditions: formData.conditionIds.length > 0 
          ? formData.conditionIds.map(id => ({ customizationId: id })) 
          : null,
      };

      if (editingId) {
        // ... (update logic)
      } else {
        // ... (insert logic)
      }

      await fetchCustomizations();
      resetForm();
    } catch (error) {
      console.error("Error saving customization:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Options for the conditions multi-select, excluding the one being edited
  const conditionOptions: MultiSelectOption[] = useMemo(() => {
    return customizations
      .filter(c => c.id !== editingId) // Prevent self-referencing conditions
      .map(c => ({ value: c.id, label: c.name }));
  }, [customizations, editingId]);

  // ... (rest of the component - rendering logic will be updated to include new fields)
}
