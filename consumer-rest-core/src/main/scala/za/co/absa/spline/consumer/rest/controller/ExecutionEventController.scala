package za.co.absa.spline.consumer.rest.controller

import java.util.Date

import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation._
import za.co.absa.spline.consumer.service.model.{ExecutionEvent, PageRequest, Pageable}
import za.co.absa.spline.consumer.service.repo.ExecutionEventRepository

import scala.concurrent.Future

@RestController
class ExecutionEventController @Autowired()(val repo: ExecutionEventRepository) {

  import scala.concurrent.ExecutionContext.Implicits._

  @GetMapping(Array("/executionEvent"))
  @ApiOperation("Returns a list of execution event info containing the time of the execution, the application Id/Name and the appendMode")
  def executionEvent
  (
    @RequestParam("timestampStart") timestampStart: String,
    @RequestParam("timestampEnd") timestampEnd: String,
    @RequestParam(value = "asAtTime", required = false, defaultValue = "") asAtTime: String,
    @RequestParam(value = "offset", required = false, defaultValue = "1") offset: String,
    @RequestParam(value = "size", required = false, defaultValue = "5") size: String
  ): Future[Pageable[ExecutionEvent]] = {

    val pageRequest = asAtTime match {
      case "" => new PageRequest()
      case _ => PageRequest(asAtTime.toLong, offset.toInt, size.toInt)
    }

    repo.findByTimestampRange(
      timestampStart,
      timestampEnd,
      pageRequest
    )
  }


}
