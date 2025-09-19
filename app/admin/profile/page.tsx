"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  avatar: string;
  profileImageUrl?: string;
  role: string;
  emailVerified: boolean;
  gamesPlayed: number;
  gamesWon: number;
  totalKills: number;
  createdAt: string;
}

const avatarOptions = [
  { label: "Avatar 1", value: "IMAGE1" },
  { label: "Avatar 2", value: "IMAGE2" },
  { label: "Avatar 3", value: "IMAGE3" },
  { label: "Avatar 4", value: "IMAGE4" },
  { label: "Avatar 5", value: "IMAGE5" },
  { label: "Avatar 6", value: "IMAGE6" },
  { label: "Avatar 7", value: "IMAGE7" },
  { label: "Avatar 8", value: "IMAGE8" },
  { label: "Avatar 9", value: "IMAGE9" },
  { label: "Avatar 10", value: "IMAGE10" },
  { label: "Avatar 11", value: "IMAGE11" },
  { label: "Avatar 12", value: "IMAGE12" },
  { label: "Avatar 13", value: "IMAGE13" },
  { label: "Avatar 14", value: "IMAGE14" },
  { label: "Avatar 15", value: "IMAGE15" },
  { label: "Avatar 16", value: "IMAGE16" },
];

export default function AdminProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    avatar: "IMAGE1",
  });

  useEffect(() => {
    if (authUser) {
      loadProfile();
    }
  }, [authUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          username: data.user.username || "",
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
          avatar: data.user.avatar || "IMAGE1",
        });
      } else {
        throw new Error("Failed to load profile");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        
        // Update auth context with new user data
        updateUser(data.user);
        
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Profile updated successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const getAvatarImage = (avatar: string) => {
    return `/images/${avatar}.png`;
  };

  if (loading) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <div className="text-center">
          <ProgressSpinner />
          <p className="mt-3 text-color-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <Toast ref={toast} />
        
        <Card title={t('profile.profileSettings')} className="w-full">
          <div className="grid">
            {/* Profile Picture Section */}
            <div className="col-12 md:col-4">
              <div className="text-center">
                <Avatar
                  image={profile?.profileImageUrl || getAvatarImage(formData.avatar)}
                  size="xlarge"
                  shape="circle"
                  className="mb-3"
                />
                <h3 className="mt-2 mb-1">
                  {formData.firstName} {formData.lastName}
                </h3>
                <p className="text-color-secondary m-0">
                  {profile?.role === "ADMIN" ? "Administrator" : "User"}
                </p>
                <Divider />
                <div className="text-sm text-color-secondary">
                  <p className="mb-1">
                    <i className="pi pi-calendar mr-2"></i>
                    Joined {new Date(profile?.createdAt || "").toLocaleDateString()}
                  </p>
                  <p className="mb-1">
                    <i className="pi pi-gamepad mr-2"></i>
                    {profile?.gamesPlayed || 0} games played
                  </p>
                  <p className="mb-0">
                    <i className="pi pi-trophy mr-2"></i>
                    {profile?.gamesWon || 0} games won
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Form Section */}
            <div className="col-12 md:col-8">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="firstName" className="font-semibold">
                      {t('profile.firstName')} *
                    </label>
                    <InputText
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="w-full"
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="lastName" className="font-semibold">
                      {t('profile.lastName')} *
                    </label>
                    <InputText
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="w-full"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="username" className="font-semibold">
                      {t('profile.username')} *
                    </label>
                    <InputText
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className="w-full"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="email" className="font-semibold">
                      {t('profile.email')} *
                    </label>
                    <InputText
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full"
                      placeholder="Enter email address"
                    />
                    {profile?.emailVerified && (
                      <small className="text-green-500">
                        <i className="pi pi-check-circle mr-1"></i>
                        Email verified
                      </small>
                    )}
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="phoneNumber" className="font-semibold">
                      {t('profile.phoneNumber')}
                    </label>
                    <InputMask
                      id="phoneNumber"
                      mask="+999 999 999 999"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      className="w-full"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="avatar" className="font-semibold">
                      {t('profile.avatar')}
                    </label>
                    <Dropdown
                      id="avatar"
                      value={formData.avatar}
                      options={avatarOptions}
                      onChange={(e) => handleInputChange("avatar", e.value)}
                      className="w-full"
                      placeholder="Select avatar"
                    />
                  </div>
                </div>

                <div className="col-12">
                  <Divider />
                  <div className="flex justify-content-end gap-2">
                    <Button
                      label={t('common.cancel')}
                      icon="pi pi-times"
                      className="p-button-outlined"
                      onClick={loadProfile}
                      disabled={saving}
                    />
                    <Button
                      label={saving ? t('common.saving') : t('common.save')}
                      icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
                      onClick={handleSave}
                      loading={saving}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
