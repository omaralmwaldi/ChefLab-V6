from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Recipe, ReviewRequest
from .serializers import RecipeCreateSerializer, RecipeReadSerializer, RecipeUpdateSerializer

class RecipeListView(generics.ListCreateAPIView):
    """
    GET: list recipes (RecipeReadSerializer).
    POST: create with RecipeCreateSerializer; response body uses RecipeReadSerializer
    so shape matches GET detail (including nested ingredients).
    """

    queryset = Recipe.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RecipeCreateSerializer
        return RecipeReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        recipe = (
            Recipe.objects.select_related("category", "author")
            .prefetch_related("recipe_ingredients__ingredient")
            .get(pk=serializer.instance.pk)
        )
        read_serializer = RecipeReadSerializer(recipe, context={"request": request})
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

"""Update Recipe"""
class RecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET: retrieve a recipe. PATCH/PUT: update. DELETE: delete."""
    queryset = Recipe.objects.all() # get all recipe from database
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]# allow create for Authenticated users and read only for unauthenticated users

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return RecipeUpdateSerializer
        return RecipeReadSerializer


class RecipeWorkflowMixin:
    """Shared helpers for workflow action views."""
    """get recipe from database by id"""
    def get_recipe(self, pk):
        return get_object_or_404(Recipe, pk=pk)

    """return recipe data in json format"""
    def recipe_response(self, recipe):
        return Response(RecipeReadSerializer(recipe).data, status=status.HTTP_200_OK)

"""POST: draft → review. Create pending ReviewRequest."""
class SendRequestView(RecipeWorkflowMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        recipe = self.get_recipe(pk) # get recipe from database by id

        # if recipe is not in draft status return error
        # if recipe.status != Recipe.Status.DRAFT: 
        #     return Response(
        #         {"detail": "Only recipes in draft status can be sent for review."},
        #         status=status.HTTP_400_BAD_REQUEST,
        #     )
        recipe.status = Recipe.Status.REVIEW
        recipe.save(update_fields=["status"])
        ReviewRequest.objects.create(
            recipe=recipe,
            requested_by=request.user,
            status=ReviewRequest.Status.PENDING,
        )
        return self.recipe_response(recipe)

"""POST: review → draft. Mark ReviewRequest as rejected."""
class RejectView(RecipeWorkflowMixin, APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        recipe = self.get_recipe(pk)
        if recipe.status != Recipe.Status.REVIEW:
            return Response(
                {"detail": "Only recipes in review can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        review_request = recipe.review_requests.filter(
            status=ReviewRequest.Status.PENDING
        ).first()
        if review_request:
            review_request.status = ReviewRequest.Status.REJECTED
            review_request.reviewed_by = request.user
            review_request.reviewed_at = timezone.now()
            review_request.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        recipe.status = Recipe.Status.DRAFT
        recipe.save(update_fields=["status"])
        return self.recipe_response(recipe)


class FinalizeView(RecipeWorkflowMixin, APIView):
    """POST: review → final. Mark ReviewRequest as approved."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        recipe = self.get_recipe(pk)
        if recipe.status != Recipe.Status.REVIEW:
            return Response(
                {"detail": "Only recipes in review can be finalized."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        review_request = recipe.review_requests.filter(
            status=ReviewRequest.Status.PENDING
        ).first()
        if review_request:
            review_request.status = ReviewRequest.Status.APPROVED
            review_request.reviewed_by = request.user
            review_request.reviewed_at = timezone.now()
            review_request.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        recipe.status = Recipe.Status.FINAL
        recipe.save(update_fields=["status"])
        return self.recipe_response(recipe)
