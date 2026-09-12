import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {getManagementReviews, replyToReview, type ManagementReview} from '../../services/restaurantManagement';

const RestaurantReviewsScreen = ({navigation}: any) => {
  const [reviews, setReviews] = useState<ManagementReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getManagementReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReply = (review: ManagementReview) => {
    setReplyingId(review.id);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyText('');
  };

  const submitReply = async (review: ManagementReview) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const result = await replyToReview(review.id, replyText.trim());
      if (!result) {
        alert('Réponse impossible', "Cet avis ne peut pas recevoir de réponse pour le moment.");
        return;
      }
      setReviews(prev =>
        prev.map(r => (r.id === review.id ? {...r, reply: replyText.trim()} : r)),
      );
      setReplyingId(null);
      setReplyText('');
    } catch (e) {
      alert('Erreur', formatAxiosError(e, "Impossible d'envoyer la réponse."));
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Avis" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Avis" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.darkGreen]} />
        }>
        {reviews.length === 0 ? (
          <View style={styles.empty}>
            <IconWrapper name="chatbubble-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun avis</Text>
            <Text style={styles.emptyText}>Les avis de vos clients apparaîtront ici.</Text>
          </View>
        ) : (
          reviews.map((review, index) => (
            <View key={review.id ?? index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.ratingRow}>
                  <IconWrapper name="star" size={16} color={Colors.darkGreen} />
                  <Text style={styles.ratingText}>{review.rating ?? review.score ?? '–'}</Text>
                </View>
                <Text style={styles.clientName}>{review.client_name ?? review.user_name ?? 'Client'}</Text>
              </View>
              {review.comment || review.comment_text ? (
                <Text style={styles.comment}>{review.comment || review.comment_text}</Text>
              ) : null}
              {review.reply ? (
                <View style={styles.replyBlock}>
                  <Text style={styles.replyLabel}>Réponse :</Text>
                  <Text style={styles.replyText}>{review.reply}</Text>
                </View>
              ) : replyingId === review.id ? (
                <View style={styles.replyForm}>
                  <TextInput
                    style={styles.replyInput}
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="Votre réponse..."
                    placeholderTextColor={Colors.textLight}
                    multiline
                    numberOfLines={3}
                    editable={!submittingReply}
                  />
                  <View style={styles.replyFormActions}>
                    <TouchableOpacity
                      style={styles.replyCancelBtn}
                      onPress={cancelReply}
                      disabled={submittingReply}>
                      <Text style={styles.replyCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.replySubmitBtn, (!replyText.trim() || submittingReply) && styles.replySubmitBtnDisabled]}
                      onPress={() => submitReply(review)}
                      disabled={!replyText.trim() || submittingReply}>
                      {submittingReply ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text style={styles.replySubmitText}>Envoyer</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.replyPromptBtn} onPress={() => openReply(review)}>
                  <IconWrapper name="arrow-undo-outline" size={16} color={Colors.darkGreen} />
                  <Text style={styles.replyPromptText}>Répondre</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  clientName: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  comment: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
    lineHeight: 20,
  },
  replyBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  replyPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  replyPromptText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  replyForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  replyFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  replyCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
  },
  replyCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  replySubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.darkGreen,
    minWidth: 84,
    alignItems: 'center',
  },
  replySubmitBtnDisabled: {
    opacity: 0.5,
  },
  replySubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
});

export default RestaurantReviewsScreen;
