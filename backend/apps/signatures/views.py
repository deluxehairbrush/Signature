from rest_framework import permissions, viewsets

from .models import DealSignature
from .serializers import DealSignatureSerializer


class DealSignatureViewSet(viewsets.ReadOnlyModelViewSet):
    """List signatures for deals the current user is part of."""

    serializer_class = DealSignatureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DealSignature.objects.filter(
            deal__client=self.request.user
        ) | DealSignature.objects.filter(
            deal__freelancer=self.request.user
        )
