import { AppColors } from "@/constants/theme";
import { MOOD_OPTIONS } from "@/lib/constants/moods";
import { formatLongDate } from "@/lib/utils/date";
import { useUser } from "@clerk/clerk-expo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { ComponentProps, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Spinner, Text, View } from "tamagui";

interface JournalImage {
  uri: string;
  caption?: string;
  alt?: string;
}

interface JournalEntryFormProps {
  initialData?: {
    title?: string;
    content: string;
    mood: string;
    images: JournalImage[];
    userId: string;
  };
  isEditing?: boolean;
  onSave: (entry: {
    title?: string;
    content: string;
    images: JournalImage[];
    mood: string;
    userId: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function JournalEntryForm({
  initialData,
  isEditing = false,
  onSave,
  onCancel,
}: JournalEntryFormProps) {
  const { user } = useUser();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [mood, setMood] = useState(initialData?.mood || "");
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<JournalImage[]>(
    initialData?.images || []
  );

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Sorry, we need camera roll permissions to add images to your journal entries"
          );
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: JournalImage = {
          uri: result.assets[0].uri,
          caption: "",
          alt: "Journal entry image",
        };
        setImages([...images, newImage]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: JournalImage = {
          uri: result.assets[0].uri,
          caption: "",
          alt: "Journal entry photo",
        };
        setImages([...images, newImage]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const updateImageCaption = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    setImages(newImages);
  };

  const showImageOptions = () => {
    Alert.alert("Add Image", "Choose how you want to add an image", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert(
        "Missing content",
        "Please write something in your journal entry"
      );
      return;
    }

    if (!mood) {
      Alert.alert("Missing mood", "Please select how you're feeling.");
      return;
    }

    if (!user?.id) {
      Alert.alert(
        "Authentication error",
        "Please sign in to save your journal entry."
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim() || undefined,
        content: content.trim(),
        images,
        mood,
        userId: user.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedMood = MOOD_OPTIONS.find((opt) => opt.value === mood);
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with date and mood */}
        <View style={styles.header}>
          <Text style={styles.date}>{formatLongDate(new Date())}</Text>
          <View style={styles.moodBar}>
            {MOOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.moodIcon,
                  mood === option.value && styles.moodIconSelected,
                ]}
                onPress={() => setMood(option.value)}
              >
                <MaterialIcons
                  size={20}
                  name={
                    option.icon as ComponentProps<typeof MaterialIcons>["name"]
                  }
                  color={mood === option.value ? option.color : "#9ca3af"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input - Minimal */}
        <TextInput
          style={styles.titleInput}
          value={title}
          placeholder="Title"
          placeholderTextColor="#9ca3af"
          maxLength={100}
          onChangeText={setTitle}
        />

        {/* Content Inut - Minimal */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Start writing..."
          placeholderTextColor="#d1d5db"
          style={styles.contentInput}
          multiline
          textAlignVertical="top"
        />

        {/* Images Section */}
        {images.length > 0 && (
          <View style={styles.imagesSection}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.image}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialIcons size={16} name="close" color="white" />
                </TouchableOpacity>
                <TextInput
                  placeholder="Add caption..."
                  placeholderTextColor="#9ca3af"
                  value={image.caption}
                  onChangeText={(text) => updateImageCaption(index, text)}
                  style={styles.imageCaption}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={showImageOptions}
          >
            <MaterialIcons size={22} name="photo" color="$6b7280" />
          </TouchableOpacity>

          {selectedMood && (
            <View style={styles.selectedMoodIndicator}>
              <MaterialIcons
                size={18}
                name={
                  selectedMood.icon as ComponentProps<
                    typeof MaterialIcons
                  >["name"]
                }
                color={selectedMood.color}
              />
            </View>
          )}
        </View>

        <View style={styles.toolbarRight}>
          <TouchableOpacity
            disabled={isSaving}
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          >
            {isSaving ? (
              <Spinner size="small" color="white" />
            ) : (
              <>
                <MaterialIcons size={18} name="check" color="white" />
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Update" : "Save"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  date: {
    fontSize: 13,
    color: AppColors.gray400,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  moodBar: {
    flexDirection: "row",
    gap: 12,
  },
  moodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  moodIconSelected: {
    backgroundColor: "#f0f9ff",
    borderWidth: 2,
    borderColor: "#e0f2fe",
  },
  titleInput: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.gray800,
    marginBottom: 16,
    padding: 0,
  },
  contentInput: {
    fontSize: 17,
    lineHeight: 28,
    color: AppColors.gray700,
    minHeight: 300,
    padding: 0,
  },
  imagesSection: {
    marginTop: 24,
    gap: 16,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageCaption: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.gray500,
    fontStyle: "italic",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray100,
  },
  toolbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedMoodIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: AppColors.gray50,
    borderRadius: 20,
  },
  selectedMoodText: {
    fontSize: 13,
    color: AppColors.gray500,
    fontWeight: "500",
  },
  toolbarRight: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.gray500,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColors.primary,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.white,
  },
});
