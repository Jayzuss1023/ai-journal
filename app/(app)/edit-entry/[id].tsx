import { getJournalEntryById, updateJournalEntry } from "@/lib/sanity/journal";
import { JOURNAL_ENTRY_BY_ID_QUERYResult } from "@/sanity/sanity.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "tamagui";

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JOURNAL_ENTRY_BY_ID_QUERYResult>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { top, bottom } = useSafeAreaInsets();

  useEffect(() => {
    const loadEntry = async () => {
      try {
        const fetchedEntry = await getJournalEntryById(id);
        if (fetchedEntry) {
          setEntry(fetchedEntry);
        } else {
          setError("Entry not found");
        }
      } catch (err) {
        console.error("Failed to load entry:", err);
        setError("Failed to load entry");
      } finally {
        setLoading(false);
      }
    };
    loadEntry();
  }, [id]);

  const handleSave = async (updatedEntry: {
    title?: string;
    content: string;
    images: { uri: string; caption?: string; alt?: string }[];
    mood: string;
    userId: string;
  }) => {
    if (!id || !entry) return;

    setSaving(true);

    try {
      // For now, we'll update text content and mood
      // Image updates would require more complex handling to detect changes.
      await updateJournalEntry(id, {
        title: updatedEntry.title,
        content: updatedEntry.content,
        mood: updatedEntry.mood,
      });

      // Navigate back to the entry detail
      router.dismiss();
      router.push(`/(app)/(tabs)/entries`);
    } catch (error) {
      console.error("Failed to update journal entry:", error);
      Alert.alert(
        "Error",
        "Failed to update your journal entry. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert("Discard Changes?", "Are you sure you want to discard your", [
      { text: "Keep Editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  };

  return (
    <View>
      <Text>Oops!</Text>
      <Text>{error || "Something went wrong loading this entry."}</Text>
    </View>
  );
}
