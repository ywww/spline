package za.co.absa.spline.consumer.service.model

class Pageable[T]
(
  val elements: Array[T],
  val totalCount: Long,
  val offset: Int,
  val size : Int
)
{
  def this() =  this(null, 0, 0, 0)
}