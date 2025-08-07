import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Reviewer {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
}

interface Booking {
  serviceType: string;
}

interface Review {
  id: number;
  reviewer: Reviewer;
  booking: Booking;
  rating: number;
  createdAt: string;
  comment?: string;
  reviewType: 'CLIENT_TO_THERAPIST' | 'THERAPIST_TO_CLIENT';
  helpfulCount: number;
}

export const ReviewsScreen: React.FC = () => {
  const [reviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={16}
          color={star <= rating ? '#FFC107' : '#E0E0E0'}
        />
      ))}
    </View>
  );

  const markAsHelpful = async () => {
    try {
      Alert.alert('Спасибо!', 'Отзыв отмечен как полезный');
    } catch {
      Alert.alert('Ошибка', 'Не удалось отметить');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Полученные
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'given' && styles.activeTab]}
          onPress={() => setActiveTab('given')}
        >
          <Text style={[styles.tabText, activeTab === 'given' && styles.activeTabText]}>
            Оставленные
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.starsContainer}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: review.reviewer.avatarUrl || '/default-avatar.png' }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.userName}>
                    {review.reviewer.firstName} {review.reviewer.lastName}
                  </Text>
                  <Text style={styles.bookingInfo}>{review.booking.serviceType}</Text>
                </View>
              </View>
              <View style={styles.ratingInfo}>
                {renderStars(review.rating)}
                <Text style={styles.dateText}>{new Date(review.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>

            {review.comment && (
              <Text style={styles.reviewComment}>
                {review.comment}
              </Text>
            )}

            <View style={styles.reviewFooter}>
              <View style={[
                styles.badge,
                review.reviewType === 'CLIENT_TO_THERAPIST' ? styles.clientBadge : styles.therapistBadge
              ]}>
                <Text style={styles.badgeText}>
                  {review.reviewType === 'CLIENT_TO_THERAPIST' ? 'От клиента' : 'От массажиста'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => markAsHelpful()}
              >
                <Ionicons name="thumbs-up-outline" size={16} color="#666" />
                <Text style={styles.helpfulText}>Полезно ({review.helpfulCount})</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#256EB',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#256EB',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  bookingInfo: {
    fontSize: 14,
    color: '#666',
  },
  ratingInfo: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    marginVertical: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clientBadge: {
    backgroundColor: '#DBEAFE',
  },
  therapistBadge: {
    backgroundColor: '#D1E5D4',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});
