import "./style.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState, useEffect, isValidElement, useRef } from "react";
import { usePostHook } from "../../hooks/postHook";
import { useCommentHook } from "../../hooks/commentHook";
import { authStore } from "../../store/auth";
import { commentSchema } from "../../validation-schemas/comment";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import Comments from "../../components/Comment";
import Post from "../../components/Posts/Post";

const post = () => {
  const { isLoggedIn, userId } = authStore((store) => store);
  const { getPost, deletePost, error } = usePostHook();
  const { createComment, loading } = useCommentHook();
  const [post, setPost] = useState({});
  const [image, setImage] = useState();
  const [comment, setComment] = useState({});
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();
  const params = useParams();

  const { register, handleSubmit } = useForm({
    resolver: yupResolver(commentSchema),
  });

  useEffect(() => {
    const specificPost = async () => {
      try {
        const post = await getPost(params.postId);
        if (post) {
          setPost(post);
        }
        setComments(response.data.comments);
        setImage(response.data.creatorId.image);
      } catch (error) {
        console.log(error);
      }
    };

    specificPost();
  }, []);

  const removePost = async () => {
    if (post.creatorId && userId === post.creatorId._id) {
      await deletePost(post._id).then((response) => {
        console.log("deleted");
      });
      navigate("/home");
    } else {
      // alert("delete only your post");
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isLoggedIn) {
        await createComment(data, post._id);
        setComment(data);
        // console.log(data);
      } else {
        alert("Connect first");
      }
    } catch (err) {
      console.log("Could not create comment");
    }
  };

  const removedComment = () => {};

  return (
    <>
      {error && <p>{error}</p>}
      {post && <Post post={post} onClick={removePost}></Post>}

      <div className="comments-container">
        {!isLoggedIn && (
          <>
            <h1>
              Please connect first to comment{" "}
              <Link to="/login">
                <b>Login</b>
              </Link>
            </h1>
          </>
        )}
        <Comments comments={comments} />

        <form className="input-comment" onSubmit={handleSubmit(onSubmit)}>
          <Textarea
            name="description"
            placeholder="Create a comment for this post"
            register={register}
          />
          <Button
            style={{ marginTop: "1px" }}
            type="submit"
            label={loading ? "Loading " : "Comment"}
            onClick={onSubmit}
          />
        </form>
      </div>
    </>
  );
};

export default post;
